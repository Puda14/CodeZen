import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Submission, SubmissionDocument } from './submission.schema';
import { Model, Types } from 'mongoose';
import { ContestService } from '../contest/contest.service';
import { ProblemService } from '../problem/problem.service';
import { SubmissionDto } from './dto/submission.dto';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
    private readonly contestService: ContestService,
    private problemService: ProblemService,
  ) {}

  async createSubmission(body: SubmissionDto): Promise<any> {
    const {
      userId,
      contest,
      problem,
      code,
      language,
      processor,
      score,
      testcaseResults,
    } = body;

    const submissionCount = await this.submissionModel.countDocuments({
      user: new Types.ObjectId(userId),
      contest: new Types.ObjectId(contest),
      problem: new Types.ObjectId(problem),
    });

    const problemDoc = await this.problemService.getProblemById(problem);

    if (submissionCount >= problemDoc.maxSubmissions) {
      throw new ForbiddenException('Maximum submissions reached');
    }

    const submission = new this.submissionModel({
      user: new Types.ObjectId(userId),
      contest: new Types.ObjectId(contest),
      problem: new Types.ObjectId(problem),
      code,
      language,
      processor,
      score,
      testcaseResults,
      attemptNumber: submissionCount + 1,
    });

    await submission.save();
    return submission;
  }

  async getSubmissionCount(
    userId: string,
    contestId: string,
    problemId: string,
  ): Promise<number> {
    let count = await this.submissionModel
      .countDocuments({
        user: new Types.ObjectId(userId),
        contest: new Types.ObjectId(contestId),
        problem: new Types.ObjectId(problemId),
      })
      .exec();
    return count;
  }

  async getUserSubmissionsInContest(userId: string, contestId: string) {
    const problemsInContest =
      await this.contestService.getContestProblems(contestId);

    const submissions = await this.submissionModel
      .find({
        user: new Types.ObjectId(userId),
        contest: new Types.ObjectId(contestId),
      })
      .populate('problem', '_id name')
      .lean();

    const submissionMap = submissions.reduce(
      (acc, submission) => {
        const problemId = submission.problem._id.toString();
        const { user, contest, problem, ...cleanSubmission } = submission;

        if (!acc[problemId]) acc[problemId] = [];
        acc[problemId].push(cleanSubmission);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const problems = problemsInContest.map((problem) => ({
      problem,
      submissions: submissionMap[problem._id] ?? [],
    }));

    return {
      user: userId,
      contest: contestId,
      problems,
    };
  }

  async getAllSubmissionsForContest(contestId: string, requesterId: string) {
    const contestOwnerId =
      await this.contestService.getContestOwnerId(contestId);
    if (contestOwnerId !== requesterId) {
      throw new ForbiddenException(
        'Only the contest owner can view all submissions.',
      );
    }

    const registrations = await this.contestService.getContestRegistrations(
      contestId,
      requesterId,
    );
    const approvedUsers = registrations
      .filter((reg) => reg.status === 'approved')
      .map((reg) => reg.user);

    const problemsInContest =
      await this.contestService.getContestProblems(contestId);

    const submissions = await this.submissionModel
      .find({ contest: new Types.ObjectId(contestId) })
      .populate('problem', '_id name')
      .lean();

    const submissionMap = submissions.reduce(
      (acc, submission) => {
        const userId = submission.user.toString();
        const problemId = submission.problem._id.toString();

        if (!acc[userId]) acc[userId] = {};
        if (!acc[userId][problemId]) acc[userId][problemId] = [];

        const { user, contest, problem, ...cleanSubmission } = submission;
        acc[userId][problemId].push(cleanSubmission);

        return acc;
      },
      {} as Record<string, Record<string, any[]>>,
    );

    const result = approvedUsers.map((user) => ({
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
      contest: contestId,
      problems: problemsInContest.map((problem) => ({
        problem,
        submissions: submissionMap[user._id.toString()]?.[problem._id] ?? [],
      })),
    }));

    return result;
  }

  async getCheckSemanticCodeLight(contest: string, userId: string) {
    const contestOwnerId = await this.contestService.getContestOwnerId(contest);
    if (contestOwnerId !== userId) {
      throw new ForbiddenException('Only the contest owner can view this.');
    }

    const registrations = await this.contestService.getContestRegistrations(
      contest,
      userId,
    );

    const approvedUsers = registrations
      .filter((reg) => reg.status === 'approved')
      .map((reg) => reg.user);

    const problems = await this.contestService.getContestProblems(contest);

    const submissions = await this.submissionModel
      .find({ contest: new Types.ObjectId(contest) })
      .select('_id user problem code language processor score')
      .populate('problem', '_id name')
      .lean();

    const grouped: Record<string, Record<string, any[]>> = {};
    for (const sub of submissions) {
      const uid = sub.user.toString();
      const pid = sub.problem._id.toString();

      if (!grouped[uid]) grouped[uid] = {};
      if (!grouped[uid][pid]) grouped[uid][pid] = [];

      grouped[uid][pid].push({
        _id: sub._id,
        code: sub.code,
        language: sub.language,
        processor: sub.processor,
        score: sub.score,
      });
    }

    const result = approvedUsers.map((user) => ({
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
      problems: problems.map((prob) => ({
        problem: {
          _id: prob._id.toString(),
          name: prob.name,
        },
        submissions: grouped[user._id.toString()]?.[prob._id.toString()] ?? [],
      })),
    }));

    return result;
  }
}
