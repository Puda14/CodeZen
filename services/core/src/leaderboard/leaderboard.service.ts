import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Leaderboard, LeaderboardDocument } from './leaderboard.schema';
import { LeaderboardCacheService } from './cache/leaderboard.cache.service';
import { InitLeaderboardDto } from './dto/leaderboard.dto';
import { LeaderboardStatus } from '../common/enums/contest.enum';
import { ContestService } from '../contest/contest.service';
import { LeaderboardGateway } from './leaderboard.gateway';
import { UserService } from '../user/user.service';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Leaderboard.name)
    private leaderboardModel: Model<LeaderboardDocument>,
    private readonly leaderboardCacheService: LeaderboardCacheService,
    private readonly userService: UserService,

    @Inject(forwardRef(() => ContestService))
    private readonly contestService: ContestService,
    private readonly leaderboardGateway: LeaderboardGateway,
  ) {}

  async saveToMongo(contestId: string): Promise<void> {
    const leaderboard =
      await this.leaderboardCacheService.getLeaderboard(contestId);
    if (!leaderboard) return;

    await this.leaderboardModel.deleteOne({
      contest: new Types.ObjectId(contestId),
    });

    await this.leaderboardModel.create({
      contestId,
      users: leaderboard.users.map((user) => ({
        user: user.user,
        totalScore: user.totalScore,
        problems: user.problems,
      })),
    });

    await this.leaderboardCacheService.deleteLeaderboard(contestId);
  }

  async deleteIfExist(contestId: string): Promise<void> {
    await this.leaderboardModel.deleteOne({ contestId });
  }

  async initLeaderboardFromContest(
    contestId: string,
    approvedUsers: {
      _id: string;
      username: string;
      email: string;
    }[],
    problemIds: string[],
  ): Promise<void> {
    const problemList = problemIds.map((pid, index) => ({
      p: `P${(index + 1).toString().padStart(2, '0')}`,
      problemId: pid,
      score: 0,
    }));

    const data = {
      contestId,
      users: approvedUsers.map((user) => ({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
        },
        totalScore: 0,
        problems: [...problemList],
      })),
    };

    await this.leaderboardCacheService.initLeaderboard(data);
  }

  async getLeaderboardByContestId(
    contestId: string,
  ): Promise<InitLeaderboardDto | null> {
    let leaderboard =
      await this.leaderboardCacheService.getLeaderboard(contestId);
    if (leaderboard) return leaderboard;

    const mongoLeaderboard = await this.leaderboardModel
      .findOne({ contestId })
      .lean();
    if (!mongoLeaderboard) return null;

    return {
      contestId: mongoLeaderboard.contestId,
      users: mongoLeaderboard.users,
    };
  }

  async getLeaderboardForUser(
    contestId: string,
    userId: string,
  ): Promise<LeaderboardWithStatus> {
    const leaderboard = await this.getLeaderboardByContestId(contestId);
    if (!leaderboard) {
      throw new NotFoundException(
        `Leaderboard for contest ${contestId} not found`,
      );
    }

    const userInLeaderboard = leaderboard.users.find(
      (u) => u.user._id === userId,
    );
    if (userInLeaderboard) {
      const status =
        await this.contestService.getContestLeaderboardStatus(contestId);
      return {
        ...leaderboard,
        leaderboardStatus: status,
      };
    }

    const ownerId = await this.contestService.getContestOwnerId(contestId);

    if (ownerId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view this leaderboard',
      );
    }

    const status =
      await this.contestService.getContestLeaderboardStatus(contestId);

    return {
      ...leaderboard,
      leaderboardStatus: status,
    };
  }

  async setContestLeaderboardStatus(
    contestId: string,
    userId: string,
    newStatus: LeaderboardStatus,
  ): Promise<{ message: string }> {
    const result = await this.contestService.setContestLeaderboardStatus(
      contestId,
      userId,
      newStatus,
    );

    // 👉 Emit websocket update
    this.leaderboardGateway.emitLeaderboardStatusUpdate(contestId, newStatus);

    return result;
  }

  async getContestLeaderboardStatus(
    contestId: string,
  ): Promise<LeaderboardStatus> {
    return this.contestService.getContestLeaderboardStatus(contestId);
  }

  async deleteLeaderboardCache(contestId: string): Promise<void> {
    this.leaderboardCacheService.deleteLeaderboard(contestId);
  }

  async syncLeaderboardFromRegistrations(contestId: string): Promise<void> {
    const ownerId = await this.contestService.getContestOwnerId(contestId);

    const registrations = await this.contestService.getContestRegistrations(
      contestId,
      ownerId,
    );

    const problems = await this.contestService.getContestProblems(contestId);
    if (!Array.isArray(problems)) {
      throw new NotFoundException(
        `Cannot retrieve problems for contest ${contestId}`,
      );
    }

    const leaderboard = (await this.leaderboardCacheService.getLeaderboard(
      contestId,
    )) ?? {
      contestId,
      users: [],
    };

    const existingUserIds = new Set(
      leaderboard.users.map((u) => u.user._id.toString()),
    );

    const newUsers = registrations
      .filter(
        (r) =>
          r.status === 'approved' &&
          r.user &&
          typeof r.user === 'object' &&
          !existingUserIds.has(r.user._id.toString()),
      )
      .map((r) => ({
        _id: r.user._id.toString(),
        username: r.user.username,
        email: r.user.email,
      }));

    if (newUsers.length === 0) return;

    const problemList = problems.map((p, i) => ({
      p: `P${(i + 1).toString().padStart(2, '0')}`,
      problemId: p._id.toString(),
      score: 0,
    }));

    for (const user of newUsers) {
      leaderboard.users.push({
        user,
        totalScore: 0,
        problems: [...problemList],
      });
    }

    leaderboard.users.sort((a, b) => b.totalScore - a.totalScore);

    await this.leaderboardCacheService.setLeaderboard(contestId, leaderboard);
    this.leaderboardGateway.emitLeaderboardUpdate(contestId, leaderboard);
  }
}

interface LeaderboardWithStatus extends InitLeaderboardDto {
  leaderboardStatus: LeaderboardStatus;
}
