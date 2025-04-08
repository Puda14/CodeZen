import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Leaderboard, LeaderboardDocument } from './leaderboard.schema';
import { LeaderboardCacheService } from './cache/leaderboard.cache.service';
import { InitLeaderboardDto } from './dto/leaderboard.dto';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Leaderboard.name) private leaderboardModel: Model<LeaderboardDocument>,
    private readonly leaderboardCacheService: LeaderboardCacheService
  ) { }

  async saveToMongo(contestId: string): Promise<void> {
    const leaderboard = await this.leaderboardCacheService.getLeaderboard(contestId);
    if (!leaderboard) return;

    await this.leaderboardModel.deleteOne({ contest: new Types.ObjectId(contestId) });

    await this.leaderboardModel.create({
      contestId,
      users: leaderboard.users.map(user => ({
        user: user.user,
        totalScore: user.totalScore,
        problems: user.problems
      }))
    });

    await this.leaderboardCacheService.deleteLeaderboard(contestId);
  }

  async deleteIfExist(contestId: string): Promise<void> {
    await this.leaderboardModel.deleteOne({ contestId });
  }

  async initLeaderboardFromContest(
    contestId: string,
    approvedUsers: {
      _id: string,
      username: string,
      email: string
    }[]
  ): Promise<void> {
    const data = {
      contestId,
      users: approvedUsers.map(user => ({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email
        },
        totalScore: 0,
        problems: []
      }))
    };

    await this.leaderboardCacheService.initLeaderboard(data);
  }

  async getLeaderboardByContestId(contestId: string): Promise<InitLeaderboardDto | null> {
    let leaderboard = await this.leaderboardCacheService.getLeaderboard(contestId);
    if (leaderboard) return leaderboard;

    const mongoLeaderboard = await this.leaderboardModel.findOne({ contestId }).lean();
    if (!mongoLeaderboard) return null;

    return {
      contestId: mongoLeaderboard.contestId,
      users: mongoLeaderboard.users
    };
  }
}
