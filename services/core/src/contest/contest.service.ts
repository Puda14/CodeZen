import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Contest, ContestDocument } from './contest.schema';
import { ProblemService } from '../problem/problem.service';
import { ContestDto } from './dto/contest.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { UserService } from '../user/user.service';
import { TestcaseService } from '../testcase/testcase.service';
import { Problem, ProblemDocument } from '../problem/problem.schema';
import { UpdateContestDto } from './dto/update-contest.dto';
import { ProblemDto } from '../problem/dto/problem.dto';
import { TestcaseDto } from '../testcase/dto/testcase.dto';
import { UpdateProblemDto } from '../problem/dto/update-problem.dto';
import { UpdateTestcaseDto } from '../testcase/dto/update-testcase.dto';
import { ContestStatus } from '../common/enums/contest.enum';
import { ContestQueueService } from './queue/contest.queue.service';
import { ContestCacheService } from './cache/contest.cache.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { UserDocument } from 'src/user/user.schema';
import { InitLeaderboardDto } from '../leaderboard/dto/leaderboard.dto';
import { LeaderboardStatus } from '../common/enums/contest.enum';
import { AppConfig } from '../config/app.config';

@Injectable()
export class ContestService {
  constructor(
    @InjectModel(Contest.name) private contestModel: Model<ContestDocument>,
    private problemService: ProblemService,
    private testcaseService: TestcaseService,
    private userService: UserService,
    private contestQueueService: ContestQueueService,
    private readonly contestCacheService: ContestCacheService,
    @Inject(forwardRef(() => LeaderboardService))
    private readonly leaderboardService: LeaderboardService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createContest(
    contestDto: ContestDto,
    userId: string,
  ): Promise<{ message: string; contestId?: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const createdProblems: ProblemDocument[] = [];
      for (const problemDto of contestDto.problems) {
        const problem = await this.problemService.createProblem(
          problemDto,
          session,
        );
        createdProblems.push(problem);
      }

      const now = new Date();
      const nowUtc = new Date(now.toISOString());
      const startTime = new Date(contestDto.start_time);
      const endTime = new Date(contestDto.end_time);

      if (startTime <= nowUtc) {
        throw new BadRequestException('Start time must be in the future');
      }

      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }

      let status = ContestStatus.UPCOMING;

      if (nowUtc >= startTime && nowUtc < endTime) {
        status = ContestStatus.ONGOING;
      } else if (nowUtc >= endTime) {
        status = ContestStatus.FINISHED;
      }

      const createdContest = await this.contestModel.create(
        [
          {
            ...contestDto,
            owner: user._id,
            problems: createdProblems.map((problem) => problem._id),
            status: status,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      if (status === ContestStatus.UPCOMING) {
        await this.contestQueueService.scheduleContest(createdContest[0]);
      }

      return {
        message: 'Contest created successfully',
        contestId: createdContest[0]._id.toString(),
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      throw new InternalServerErrorException(`${error.message}`);
    }
  }

  async deleteContest(contestId: string, userId: string): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this contest',
      );
    }

    if (contest.problems && contest.problems.length > 0) {
      for (const problemId of contest.problems) {
        await this.problemService.deleteProblem(problemId.toString());
      }
    }

    await this.contestModel.findByIdAndDelete(contestId);
  }

  async registerForContest(contestId: string, userId: string): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() === userId) {
      throw new BadRequestException('You cannot register for your own contest');
    }

    const existingRegistration = contest.registrations.find(
      (reg) => reg.user.toString() === userId,
    );

    if (existingRegistration) {
      throw new BadRequestException(
        'You are already registered for this contest',
      );
    } else {
      contest.registrations.push({
        user: new Types.ObjectId(userId),
        status: 'pending',
      });
      await contest.save();
    }
  }

  async cancelRegistration(contestId: string, userId: string): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    const registrationIndex = contest.registrations.findIndex(
      (reg) => reg.user.toString() === userId,
    );

    if (registrationIndex === -1) {
      throw new NotFoundException('You are not registered for this contest');
    }

    contest.registrations.splice(registrationIndex, 1);
    await contest.save();
  }

  async updateRegistrationStatus(
    contestId: string,
    registeredUserId: string,
    status: string,
    ownerId: string,
  ): Promise<void> {
    if (!['approved', 'rejected'].includes(status)) {
      throw new BadRequestException(
        'Invalid status. Must be "approved" or "rejected"',
      );
    }

    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== ownerId) {
      throw new ForbiddenException(
        'Only the contest owner can update registration status',
      );
    }

    const registrationIndex = contest.registrations.findIndex(
      (reg) => reg.user.toString() === registeredUserId,
    );

    if (registrationIndex === -1) {
      throw new NotFoundException(
        `Registration for user ${registeredUserId} not found`,
      );
    }

    if (status === 'rejected') {
      contest.registrations.splice(registrationIndex, 1);
    } else {
      contest.registrations[registrationIndex].status = status;
    }

    await contest.save();

    if (contest.status === ContestStatus.ONGOING) {
      await this.updateContestCache(contestId);
      await this.leaderboardService.syncLeaderboardFromRegistrations(contestId);
    }
  }

  async getContestRegistrations(
    contestId: string,
    userId: string,
  ): Promise<any> {
    const contest = await this.contestModel
      .findById(contestId)
      .populate('registrations.user', '_id username email')
      .exec();

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException(
        'Only the contest owner can view registrations',
      );
    }

    return contest.registrations;
  }

  async getContestDetails(
    contestId: string,
    userId: string,
  ): Promise<ContestDocument> {
    let contest = await this.contestCacheService.getCachedContest(contestId);

    if (!contest) {
      console.log(`❌ Cache miss: Fetching contest ${contestId} from MongoDB`);
      contest = await this.fetchFullContestDetails(contestId);
    } else {
      console.log(`✅ Cache hit: Contest ${contestId} loaded from Redis`);
    }

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    const userRegistration = contest.registrations.find(
      (reg) => reg.user._id?.toString() === userId && reg.status === 'approved',
    );

    if (!userRegistration) {
      throw new ForbiddenException(
        'You must be an approved participant to view contest details',
      );
    }

    return this.transformContestResponse(contest);
  }

  async getContestBasicInfo(
    contestId: string,
    userId?: string,
  ): Promise<Partial<ContestDocument>> {
    const contest = await this.contestModel
      .findById(contestId)
      .populate('owner', '_id username email')
      .exec();

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (!contest.isPublic) {
      const isRegistered = contest.registrations.some(
        (reg) => reg.user?.toString() === userId && reg.status === 'approved',
      );

      if (!isRegistered) {
        throw new ForbiddenException('This contest is private');
      }
    }

    return {
      _id: contest._id,
      title: contest.title,
      description: contest.description,
      start_time: contest.start_time,
      end_time: contest.end_time,
      owner: contest.owner,
      status: contest.status,
      isPublic: contest.isPublic,
      leaderboardStatus: contest.leaderboardStatus,
    };
  }

  async getContestRegistrationStatus(
    contestId: string,
    userId: string,
  ): Promise<{ status: string }> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    const registration = contest.registrations.find(
      (reg) => reg.user.toString() === userId,
    );

    if (!registration) {
      return { status: 'not_registered' };
    }

    return { status: registration.status };
  }

  async addParticipants(
    contestId: string,
    emails: string[],
    ownerId: string,
  ): Promise<{ results: ParticipantResult[] }> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== ownerId) {
      throw new ForbiddenException(
        'Only the contest owner can add participants',
      );
    }

    const results: ParticipantResult[] = [];

    for (const email of emails) {
      try {
        const user = await this.userService.findByEmail(email);

        if (!user) {
          results.push({
            email,
            status: 'failed',
            message: 'User not found',
          });
          continue;
        }

        if (user._id.toString() === contest.owner.toString()) {
          results.push({
            email,
            status: 'failed',
            message: 'Contest owner cannot be registered as a participant',
          });
          continue;
        }

        const existingRegistration = contest.registrations.find(
          (reg) => reg.user.toString() === user._id.toString(),
        );

        if (existingRegistration) {
          results.push({
            email,
            status: 'failed',
            message: 'User already registered',
          });
          continue;
        }

        contest.registrations.push({
          user: new Types.ObjectId(user._id),
          status: 'approved',
        });

        results.push({
          email,
          status: 'success',
          message: 'User added successfully',
        });
      } catch (error) {
        results.push({
          email,
          status: 'failed',
          message: error.message,
        });
      }
    }

    await contest.save();

    if (contest.status === ContestStatus.ONGOING) {
      await this.updateContestCache(contestId);
      await this.leaderboardService.syncLeaderboardFromRegistrations(contestId);
    }

    return { results };
  }

  async updateContest(
    contestId: string,
    updateContestDto: UpdateContestDto,
    userId: string,
  ): Promise<void> {
    // Step 1: Fetch the contest
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    // Step 2: Authorization
    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException(
        'Only the contest owner can update this contest',
      );
    }

    // Step 3: Validate time logic
    const now = new Date();
    const newStartTime = updateContestDto.start_time
      ? new Date(updateContestDto.start_time)
      : contest.start_time;
    const newEndTime = updateContestDto.end_time
      ? new Date(updateContestDto.end_time)
      : contest.end_time;

    if (newStartTime >= newEndTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Step 4: Update contest in MongoDB
    delete (updateContestDto as any).status;
    await this.contestModel.findByIdAndUpdate(contestId, {
      $set: updateContestDto,
    });

    // Step 5: Refetch updated contest
    const updatedContest = await this.contestModel.findById(contestId);
    if (!updatedContest) {
      throw new NotFoundException(
        `Contest with ID ${contestId} not found after update`,
      );
    }

    // Step 6: If contest is ONGOING or FINISHED and start_time was changed to a future time => revert to UPCOMING
    if (
      updateContestDto.start_time &&
      (updatedContest.status === ContestStatus.ONGOING ||
        updatedContest.status === ContestStatus.FINISHED) &&
      newStartTime > now
    ) {
      console.log(
        `♻️ Reverting contest ${contestId} to UPCOMING due to new start_time in the future`,
      );

      await this.contestModel.findByIdAndUpdate(contestId, {
        status: ContestStatus.UPCOMING,
      });
      await this.contestCacheService.deleteCachedContest(contestId);

      const refreshedContest = await this.contestModel.findById(contestId);
      if (!refreshedContest) {
        throw new NotFoundException(
          `Contest ${contestId} not found after reverting`,
        );
      }

      const jobs =
        await this.contestQueueService.getDelayedJobsForContest(contestId);
      await Promise.all(
        jobs.map((job) =>
          job.id
            ? this.contestQueueService.removeJobById(job.id)
            : Promise.resolve(),
        ),
      );
      await this.contestQueueService.scheduleContest(refreshedContest);
      await this.leaderboardService.deleteIfExist(contestId);
      await this.leaderboardService.deleteLeaderboardCache(contestId);
      console.log(
        `✅ Contest ${contestId} reverted to UPCOMING and rescheduled`,
      );
      return;
    }

    // Step 7: Reschedule start job if start_time changed and contest is UPCOMING
    if (
      updateContestDto.start_time &&
      updatedContest.status === ContestStatus.UPCOMING
    ) {
      console.log(
        `♻️ Rescheduling start job for contest ${contestId} (start_time changed)`,
      );

      const jobs =
        await this.contestQueueService.getDelayedJobsForContest(contestId);
      await Promise.all(
        jobs.map((job) =>
          job.id
            ? this.contestQueueService.removeJobById(job.id)
            : Promise.resolve(),
        ),
      );

      await this.contestQueueService.scheduleContest(updatedContest);
      console.log(
        `✅ Successfully rescheduled start job for contest ${contestId}`,
      );
    }

    // Step 8: Handle end_time change for ONGOING contest
    if (
      updateContestDto.end_time &&
      updatedContest.status === ContestStatus.ONGOING
    ) {
      console.log(
        `♻️ Rescheduling finish job for contest ${contestId} (end_time changed)`,
      );

      const finishJobs =
        await this.contestQueueService.getDelayedJobsForContest(contestId);
      await Promise.all(
        finishJobs.map((job) =>
          job.id
            ? this.contestQueueService.removeJobById(job.id)
            : Promise.resolve(),
        ),
      );

      if (newEndTime > now) {
        const delay = newEndTime.getTime() - now.getTime();
        console.log(
          `📅 Scheduling new finish job for contest ${contestId} in ${delay} ms`,
        );
        await this.contestQueueService.scheduleFinishContest(updatedContest);

        console.log(`🔄 Updating Redis cache for ongoing contest ${contestId}`);
        await this.updateContestCache(contestId);
        console.log(`✅ Cache updated for contest ${contestId}`);
      } else {
        console.warn(
          `⚠️ New end_time is in the past. Finishing contest ${contestId}`,
        );
        await this.contestModel.findByIdAndUpdate(contestId, {
          status: ContestStatus.FINISHED,
        });
        await this.contestCacheService.deleteCachedContest(contestId);
        await this.leaderboardService.saveToMongo(contestId);
        await this.leaderboardService.deleteIfExist(contestId);
        console.log(
          `🗑️ Deleted cache and marked contest ${contestId} as FINISHED`,
        );
        return;
      }
    }

    // Step 9: Refresh cache if contest is still ONGOING and no end_time update
    if (
      updatedContest.status === ContestStatus.ONGOING &&
      !updateContestDto.end_time
    ) {
      console.log(`🔄 Refreshing Redis cache for ongoing contest ${contestId}`);
      await this.updateContestCache(contestId);
      console.log(`✅ Cache refreshed for contest ${contestId}`);
    }
  }

  async addProblemToContest(
    contestId: string,
    problemDto: ProblemDto,
    userId: string,
  ): Promise<{ message: string; problemId: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const contest = await this.contestModel.findById(contestId);
      if (!contest) {
        throw new NotFoundException(`Contest with ID ${contestId} not found`);
      }

      if (contest.owner.toString() !== userId) {
        throw new ForbiddenException('Only the contest owner can add problems');
      }

      const problem = await this.problemService.createProblem(
        problemDto,
        session,
      );

      await this.contestModel.findByIdAndUpdate(
        contestId,
        { $push: { problems: problem._id } },
        { session },
      );

      await session.commitTransaction();

      if (contest.status === ContestStatus.ONGOING) {
        await this.updateContestCache(contestId);
      }

      return {
        message: 'Problem added to contest successfully',
        problemId: problem._id.toString(),
      };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `Failed to add problem to contest: ${error.message}`,
      );
    } finally {
      session.endSession();
    }
  }

  async removeProblemFromContest(
    contestId: string,
    problemId: string,
    userId: string,
  ): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException(
        'Only the contest owner can remove problems',
      );
    }

    const problemIndex = contest.problems.findIndex(
      (id) => id.toString() === problemId,
    );

    if (problemIndex === -1) {
      throw new NotFoundException(
        `Problem with ID ${problemId} not found in this contest`,
      );
    }

    contest.problems.splice(problemIndex, 1);
    await contest.save();

    await this.problemService.deleteProblem(problemId);

    if (contest.status === ContestStatus.ONGOING) {
      await this.updateContestCache(contestId);
    }
  }

  async addTestcasesToProblem(
    contestId: string,
    problemId: string,
    testcasesDto: TestcaseDto[],
    userId: string,
  ): Promise<{ message: string; testcaseIds: string[] }> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('Only the contest owner can add testcases');
    }

    const problemExists = contest.problems.some(
      (p) => p.toString() === problemId,
    );
    if (!problemExists) {
      throw new NotFoundException(
        `Problem with ID ${problemId} not found in this contest`,
      );
    }

    const problemExists2 =
      await this.problemService.checkProblemExists(problemId);
    if (!problemExists2) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    const createdTestcases =
      await this.testcaseService.createTestcases(testcasesDto);

    await this.problemService.addTestcasesToProblem(
      problemId,
      createdTestcases.map((tc) => tc._id),
    );

    if (contest.status === ContestStatus.ONGOING) {
      await this.updateContestCache(contestId);
    }

    return {
      message: 'Testcases added successfully',
      testcaseIds: createdTestcases.map((tc) => tc._id.toString()),
    };
  }

  async removeTestcasesFromProblem(
    contestId: string,
    problemId: string,
    testcaseIds: string[],
    userId: string,
  ): Promise<{ message: string }> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException(
        'Only the contest owner can remove testcases',
      );
    }

    const problemExists = contest.problems.some(
      (p) => p.toString() === problemId,
    );
    if (!problemExists) {
      throw new NotFoundException(
        `Problem with ID ${problemId} not found in this contest`,
      );
    }

    const problemExists2 =
      await this.problemService.checkProblemExists(problemId);
    if (!problemExists2) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    await this.problemService.removeTestcasesFromProblem(
      problemId,
      testcaseIds,
    );

    await this.testcaseService.deleteTestcases(
      testcaseIds.map((id) => new Types.ObjectId(id)),
    );

    if (contest.status === ContestStatus.ONGOING) {
      await this.updateContestCache(contestId);
    }

    return { message: 'Testcases removed successfully' };
  }

  async updateProblem(
    contestId: string,
    problemId: string,
    updateProblemDto: UpdateProblemDto,
    userId: string,
  ): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException(
        'Only the contest owner can update problems',
      );
    }

    const problemExists = contest.problems.some(
      (p) => p.toString() === problemId,
    );
    if (!problemExists) {
      throw new NotFoundException(
        `Problem with ID ${problemId} not found in this contest`,
      );
    }

    await this.problemService.updateProblemData(problemId, updateProblemDto);

    if (contest.status === ContestStatus.ONGOING) {
      await this.updateContestCache(contestId);
    }
  }

  async updateTestcases(
    contestId: string,
    problemId: string,
    testcasesToUpdate: UpdateTestcaseDto[],
    userId: string,
  ): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException(
        'Only the contest owner can update testcases',
      );
    }

    const problemExists = contest.problems.some(
      (p) => p.toString() === problemId,
    );
    if (!problemExists) {
      throw new NotFoundException(
        `Problem with ID ${problemId} not found in this contest`,
      );
    }

    const problemExists2 =
      await this.problemService.checkProblemExists(problemId);
    if (!problemExists2) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    const testcaseIds =
      await this.problemService.getProblemTestcaseIds(problemId);

    for (const testcase of testcasesToUpdate) {
      if (!testcaseIds.includes(testcase.id)) {
        throw new NotFoundException(
          `Testcase with ID ${testcase.id} not found in this problem`,
        );
      }
    }

    for (const testcase of testcasesToUpdate) {
      const { id, ...updateData } = testcase;
      await this.testcaseService.updateTestcase(id, updateData);
    }

    if (contest.status === ContestStatus.ONGOING) {
      await this.updateContestCache(contestId);
    }
  }

  async getContestsByStatus(status: ContestStatus): Promise<Contest[]> {
    return this.contestModel
      .find({
        status,
        isPublic: true,
      })
      .populate('owner', 'username email')
      .select('-problems -registrations')
      .exec();
  }

  async getRegisteredContests(userId: string): Promise<Contest[]> {
    return this.contestModel
      .find({
        'registrations.user': userId,
        'registrations.status': 'approved',
      })
      .populate('owner', 'username email')
      .select('-problems -registrations')
      .exec();
  }

  async getOwnedContests(userId: string): Promise<Contest[]> {
    return this.contestModel
      .find({ owner: new Types.ObjectId(userId) })
      .populate('owner', 'username email')
      .select('-registrations')
      .exec();
  }

  async getProblemForContestant(
    contestId: string,
    problemId: string,
    userId: string,
  ): Promise<Problem> {
    let contest = await this.contestCacheService.getCachedContest(contestId);

    if (!contest) {
      console.log(`❌ Cache miss: Fetching contest ${contestId} from MongoDB`);
      contest = await this.fetchFullContestDetails(contestId);
    } else {
      console.log(`✅ Cache hit: Contest ${contestId} loaded from Redis`);
    }

    if (!contest) {
      throw new NotFoundException('Contest not found');
    }

    const problem = contest.problems.find(
      (p) => p._id.toString() === problemId,
    );
    if (!problem) {
      throw new NotFoundException('Problem not found in this contest');
    }

    const isRegistered = contest.registrations.some(
      (reg) => reg.user._id?.toString() === userId && reg.status === 'approved',
    );

    if (!isRegistered) {
      throw new ForbiddenException('You are not registered for this contest');
    }

    return this.transformProblemResponse(problem);
  }

  async getProblemForOwner(
    contestId: string,
    problemId: string,
    userId: string,
  ): Promise<Problem> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }

    const problemExists = contest.problems.some(
      (p) => p.toString() === problemId,
    );
    if (!problemExists) {
      throw new NotFoundException('Problem not found in this contest');
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('You are not the owner of this contest');
    }

    return this.problemService.getProblemWithAllTestcases(problemId);
  }

  async updateContestStatus(
    contestId: string,
    newStatus: ContestStatus,
  ): Promise<ContestDocument | null> {
    return this.contestModel
      .findByIdAndUpdate(contestId, { status: newStatus }, { new: true })
      .exec();
  }

  async fetchFullContestDetails(contestId: string): Promise<any> {
    const contest = await this.contestModel
      .findById(contestId)
      .populate('owner', '_id username email')
      .populate({
        path: 'problems',
        model: 'Problem',
        populate: {
          path: 'testcases',
          model: 'Testcase',
          transform: (doc) => {
            if (doc.isPublic) {
              return {
                _id: doc._id,
                score: doc.score,
                input: doc.input,
                output: doc.output,
                isPublic: true,
                timeout: doc.timeout,
              };
            } else {
              return {
                _id: doc._id,
                score: doc.score,
                input: doc.input,
                output: doc.output,
                isPublic: false,
                timeout: doc.timeout,
              };
            }
          },
        },
      })
      .populate({
        path: 'registrations.user',
        model: 'User',
        select: '_id username email',
      })
      .select('-__v')
      .orFail(new NotFoundException(`Contest with ID ${contestId} not found`))
      .exec();

    return contest;
  }

  async transformContestResponse(contest: any): Promise<any> {
    return {
      _id: contest._id,
      title: contest.title,
      start_time: contest.start_time,
      end_time: contest.end_time,
      owner: contest.owner,
      status: contest.status,
      description: contest.description,
      isPublic: contest.isPublic,
      leaderboardStatus: contest.leaderboardStatus,
      problems: contest.problems.map((problem) => ({
        _id: problem._id,
        name: problem.name,
        content: problem.content,
        difficulty: problem.difficulty,
        tags: problem.tags,
        maxSubmissions: problem.maxSubmissions,
        testcases:
          problem.testcases?.map((tc) =>
            tc.isPublic
              ? {
                  _id: tc._id,
                  score: tc.score,
                  input: tc.input,
                  output: tc.output,
                  isPublic: true,
                  timeout: tc.timeout,
                }
              : {
                  _id: tc._id,
                  score: tc.score,
                  timeout: tc.timeout,
                },
          ) || [],
      })),
    };
  }

  async transformProblemResponse(problem: any): Promise<any> {
    return {
      _id: problem._id,
      name: problem.name,
      content: problem.content,
      difficulty: problem.difficulty,
      tags: problem.tags,
      testcases:
        problem.testcases?.map((tc) =>
          tc.isPublic
            ? {
                _id: tc._id,
                score: tc.score,
                input: tc.input,
                output: tc.output,
                isPublic: true,
              }
            : {
                _id: tc._id,
                score: tc.score,
              },
        ) || [],
    };
  }

  async updateContestCache(contestId: string) {
    const fullContestDetails = await this.fetchFullContestDetails(contestId);

    const cachedContest =
      await this.contestCacheService.getCachedContest(contestId);

    if (
      !cachedContest ||
      JSON.stringify(cachedContest) !== JSON.stringify(fullContestDetails)
    ) {
      console.log(`🔄 Updating cache for contest ${contestId}`);
      await this.contestCacheService.setCachedContest(
        contestId,
        fullContestDetails,
        AppConfig.cache.contestTtl,
      );
    } else {
      console.log(
        `✅ Cache is already up-to-date for contest ${contestId}, skipping update.`,
      );
    }
  }

  async getContestForOwner(
    contestId: string,
    userId: string,
  ): Promise<ContestDocument> {
    const contest = await this.contestModel
      .findById(contestId)
      .populate('owner', '_id username email')
      .populate({
        path: 'problems',
        model: 'Problem',
        populate: {
          path: 'testcases',
          model: 'Testcase',
        },
      })
      .populate({
        path: 'registrations.user',
        model: 'User',
        select: '_id username email',
      })
      .select('-registrations')
      .exec();

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    const owner = contest.owner as UserDocument;
    if (owner._id.toString() !== userId) {
      throw new ForbiddenException('You are not the owner of this contest');
    }

    return contest;
  }

  async getContestOwnerId(contestId: string): Promise<string> {
    const contest = await this.contestModel
      .findById(contestId)
      .select('owner')
      .lean();

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    return contest.owner.toString();
  }

  async getContestLeaderboardStatus(
    contestId: string,
  ): Promise<LeaderboardStatus> {
    const contest = await this.contestModel
      .findById(contestId)
      .select('leaderboardStatus')
      .lean();

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    return contest.leaderboardStatus;
  }

  async setContestLeaderboardStatus(
    contestId: string,
    userId: string,
    newStatus: LeaderboardStatus,
  ): Promise<{ message: string }> {
    // Step 1: Lấy thông tin contest
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    // Step 2: Kiểm tra quyền owner
    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException(
        'Only the contest owner can update leaderboard status',
      );
    }

    // Step 3: Validate status hợp lệ (nếu cần)
    if (!Object.values(LeaderboardStatus).includes(newStatus)) {
      console.error(`Invalid leaderboard status: ${newStatus}`);
      throw new BadRequestException(`Invalid leaderboard status: ${newStatus}`);
    }

    // Step 4: Update status
    contest.leaderboardStatus = newStatus;
    await contest.save();

    return { message: `Leaderboard status updated to ${newStatus}` };
  }

  async getContestProblems(
    contestId: string,
  ): Promise<{ _id: string; name: string }[]> {
    const contest = await this.contestModel
      .findById(contestId)
      .select('problems')
      .lean();

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    return this.problemService.getProblemsByIds(
      contest.problems.map((id) => id.toString()),
    );
  }
}

interface ParticipantResult {
  email: string;
  status: string;
  message?: string;
}

interface LeaderboardWithStatus extends InitLeaderboardDto {
  leaderboardStatus: LeaderboardStatus;
}
