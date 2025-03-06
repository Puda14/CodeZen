import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class ContestService {
  constructor(
    @InjectModel(Contest.name) private contestModel: Model<ContestDocument>,
    private problemService: ProblemService,
    private testcaseService: TestcaseService,
    private userService: UserService,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  async createContest(contestDto: ContestDto, userId: string): Promise<{ message: string; contestId?: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const createdProblems: ProblemDocument[] = [];
      for (const problemDto of contestDto.problems) {
        const problem = await this.problemService.createProblem(problemDto, session);
        createdProblems.push(problem);
      }

      const createdContest = await this.contestModel.create(
        [{ ...contestDto, owner: user._id, problems: createdProblems.map(problem => problem._id) }],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        message: 'Contest created successfully',
        contestId: createdContest[0]._id.toString()
      };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      throw new InternalServerErrorException(`Failed to create contest: ${error.message}`);
    }
  }

  async deleteContest(contestId: string, userId: string): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this contest');
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
      reg => reg.user.toString() === userId
    );

    if (existingRegistration) {
      throw new BadRequestException('You are already registered for this contest');
    } else {
      contest.registrations.push({
        user: new Types.ObjectId(userId),
        status: 'pending'
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
      reg => reg.user.toString() === userId
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
    ownerId: string
  ): Promise<void> {
    if (!['approved', 'rejected'].includes(status)) {
      throw new BadRequestException('Invalid status. Must be "approved" or "rejected"');
    }

    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== ownerId) {
      throw new ForbiddenException('Only the contest owner can update registration status');
    }

    const registrationIndex = contest.registrations.findIndex(
      reg => reg.user.toString() === registeredUserId
    );

    if (registrationIndex === -1) {
      throw new NotFoundException(`Registration for user ${registeredUserId} not found`);
    }

    if (status === 'rejected') {
      contest.registrations.splice(registrationIndex, 1);
    } else {
      contest.registrations[registrationIndex].status = status;
    }

    await contest.save();
  }

  async getContestRegistrations(contestId: string, userId: string): Promise<any> {
    const contest = await this.contestModel.findById(contestId)
      .populate('registrations.user', '_id username email')
      .exec();

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('Only the contest owner can view registrations');
    }

    return contest.registrations;
  }

  async getContestDetails(contestId: string, userId: string): Promise<ContestDocument> {
    const contest = await this.contestModel.findById(contestId);

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    const userRegistration = contest.registrations.find(
      reg => reg.user.toString() === userId && reg.status === 'approved'
    );

    if (!userRegistration) {
      throw new ForbiddenException('You must be an approved participant to view contest details');
    }

    return await this.contestModel
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
                isPublic: true
              };
            } else {
              return {
                _id: doc._id,
                score: doc.score
              };
            }
          }
        }
      })
      .select('-registrations')
      .orFail(new NotFoundException(`Contest with ID ${contestId} not found`))
      .exec();
  }

  async getContestBasicInfo(contestId: string): Promise<Partial<ContestDocument>> {
    const contest = await this.contestModel
      .findById(contestId)
      .populate('owner', '_id username email')
      .exec();

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (!contest.isPublic) {
      throw new ForbiddenException('This contest is private');
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
      leaderboardStatus: contest.leaderboardStatus
    };
  }

  async addParticipants(
    contestId: string,
    emails: string[],
    ownerId: string
  ): Promise<{ results: ParticipantResult[] }> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== ownerId) {
      throw new ForbiddenException('Only the contest owner can add participants');
    }

    const results: ParticipantResult[] = [];

    for (const email of emails) {
      try {
        const user = await this.userService.findByEmail(email);

        if (!user) {
          results.push({
            email,
            status: 'failed',
            message: 'User not found'
          });
          continue;
        }

        if (user._id.toString() === contest.owner.toString()) {
          results.push({
            email,
            status: 'failed',
            message: 'Contest owner cannot be registered as a participant'
          });
          continue;
        }

        const existingRegistration = contest.registrations.find(
          reg => reg.user.toString() === user._id.toString()
        );

        if (existingRegistration) {
          results.push({
            email,
            status: 'failed',
            message: 'User already registered'
          });
          continue;
        }

        contest.registrations.push({
          user: new Types.ObjectId(user._id),
          status: 'approved'
        });

        results.push({
          email,
          status: 'success',
          message: 'User added successfully'
        });
      } catch (error) {
        results.push({
          email,
          status: 'failed',
          message: error.message
        });
      }
    }

    await contest.save();

    return { results };
  }

  async updateContest(
    contestId: string,
    updateContestDto: UpdateContestDto,
    userId: string
  ): Promise<void> {
    const contest = await this.contestModel.findById(contestId);

    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('Only the contest owner can update this contest');
    }

    if (updateContestDto.start_time && updateContestDto.end_time) {
      if (new Date(updateContestDto.start_time) >= new Date(updateContestDto.end_time)) {
        throw new BadRequestException('Start time must be before end time');
      }
    } else if (updateContestDto.start_time && !updateContestDto.end_time) {
      if (new Date(updateContestDto.start_time) >= contest.end_time) {
        throw new BadRequestException('Start time must be before end time');
      }
    } else if (!updateContestDto.start_time && updateContestDto.end_time) {
      if (contest.start_time >= new Date(updateContestDto.end_time)) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    await this.contestModel.findByIdAndUpdate(contestId, {
      $set: updateContestDto
    });
  }

  async addProblemToContest(
    contestId: string,
    problemDto: ProblemDto,
    userId: string
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

      const problem = await this.problemService.createProblem(problemDto, session);

      await this.contestModel.findByIdAndUpdate(
        contestId,
        { $push: { problems: problem._id } },
        { session }
      );

      await session.commitTransaction();

      return {
        message: 'Problem added to contest successfully',
        problemId: problem._id.toString()
      };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(`Failed to add problem to contest: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  async removeProblemFromContest(contestId: string, problemId: string, userId: string): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('Only the contest owner can remove problems');
    }

    const problemIndex = contest.problems.findIndex(
      id => id.toString() === problemId
    );

    if (problemIndex === -1) {
      throw new NotFoundException(`Problem with ID ${problemId} not found in this contest`);
    }

    contest.problems.splice(problemIndex, 1);
    await contest.save();

    await this.problemService.deleteProblem(problemId);
  }

  async addTestcasesToProblem(
    contestId: string,
    problemId: string,
    testcasesDto: TestcaseDto[],
    userId: string
  ): Promise<{ message: string; testcaseIds: string[] }> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('Only the contest owner can add testcases');
    }

    const problemExists = contest.problems.some(p => p.toString() === problemId);
    if (!problemExists) {
      throw new NotFoundException(`Problem with ID ${problemId} not found in this contest`);
    }

    const problemExists2 = await this.problemService.checkProblemExists(problemId);
    if (!problemExists2) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    const createdTestcases = await this.testcaseService.createTestcases(testcasesDto);

    await this.problemService.addTestcasesToProblem(
      problemId,
      createdTestcases.map(tc => tc._id)
    );

    return {
      message: 'Testcases added successfully',
      testcaseIds: createdTestcases.map(tc => tc._id.toString())
    };
  }

  async removeTestcasesFromProblem(
    contestId: string,
    problemId: string,
    testcaseIds: string[],
    userId: string
  ): Promise<{ message: string }> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('Only the contest owner can remove testcases');
    }

    const problemExists = contest.problems.some(p => p.toString() === problemId);
    if (!problemExists) {
      throw new NotFoundException(`Problem with ID ${problemId} not found in this contest`);
    }

    const problemExists2 = await this.problemService.checkProblemExists(problemId);
    if (!problemExists2) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    await this.problemService.removeTestcasesFromProblem(problemId, testcaseIds);

    await this.testcaseService.deleteTestcases(testcaseIds.map(id => new Types.ObjectId(id)));

    return { message: 'Testcases removed successfully' };
  }

  async updateProblem(
    contestId: string,
    problemId: string,
    updateProblemDto: UpdateProblemDto,
    userId: string
  ): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('Only the contest owner can update problems');
    }

    const problemExists = contest.problems.some(p => p.toString() === problemId);
    if (!problemExists) {
      throw new NotFoundException(`Problem with ID ${problemId} not found in this contest`);
    }

    await this.problemService.updateProblemData(problemId, updateProblemDto);
  }

  async updateTestcases(
    contestId: string,
    problemId: string,
    testcasesToUpdate: UpdateTestcaseDto[],
    userId: string
  ): Promise<void> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException(`Contest with ID ${contestId} not found`);
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('Only the contest owner can update testcases');
    }

    const problemExists = contest.problems.some(p => p.toString() === problemId);
    if (!problemExists) {
      throw new NotFoundException(`Problem with ID ${problemId} not found in this contest`);
    }

    const problemExists2 = await this.problemService.checkProblemExists(problemId);
    if (!problemExists2) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    const testcaseIds = await this.problemService.getProblemTestcaseIds(problemId);

    for (const testcase of testcasesToUpdate) {
      if (!testcaseIds.includes(testcase.id)) {
        throw new NotFoundException(`Testcase with ID ${testcase.id} not found in this problem`);
      }
    }

    for (const testcase of testcasesToUpdate) {
      const { id, ...updateData } = testcase;
      await this.testcaseService.updateTestcase(id, updateData);
    }
  }

  async getContestsByStatus(status: ContestStatus): Promise<Contest[]> {
    return this.contestModel.find({
      status,
      isPublic: true
    })
      .populate('owner', 'username email')
      .select('-problems -registrations')
      .exec();
  }

  async getRegisteredContests(userId: string): Promise<Contest[]> {
    return this.contestModel.find({
      'registrations.user': userId,
      'registrations.status': 'approved'
    })
      .populate('owner', 'username email')
      .select('-problems -registrations')
      .exec();
  }

  async getOwnedContests(userId: string): Promise<Contest[]> {
    return this.contestModel.find({ owner: new Types.ObjectId(userId) })
      .populate('owner', 'username email')
      .select('-registrations')
      .exec();
  }

  async getProblemForContestant(contestId: string, problemId: string, userId: string): Promise<Problem> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }

    const problemExists = contest.problems.some(p => p.toString() === problemId);
    if (!problemExists) {
      throw new NotFoundException('Problem not found in this contest');
    }

    const isRegistered = contest.registrations.some(
      reg => reg.user.toString() === userId && reg.status === 'approved'
    );
    if (!isRegistered) {
      throw new ForbiddenException('You are not registered for this contest');
    }

    return this.problemService.getProblemWithPublicTestcases(problemId);
  }

  async getProblemForOwner(contestId: string, problemId: string, userId: string): Promise<Problem> {
    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }

    const problemExists = contest.problems.some(p => p.toString() === problemId);
    if (!problemExists) {
      throw new NotFoundException('Problem not found in this contest');
    }

    if (contest.owner.toString() !== userId) {
      throw new ForbiddenException('You are not the owner of this contest');
    }

    return this.problemService.getProblemWithAllTestcases(problemId);
  }
}

interface ParticipantResult {
  email: string;
  status: string;
  message?: string;
}
