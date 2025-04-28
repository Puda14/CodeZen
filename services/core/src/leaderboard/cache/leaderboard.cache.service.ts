import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  InitLeaderboardDto,
  LeaderboardUserDto,
  ProblemScoreDto,
} from '../dto/leaderboard.dto';
import { LeaderboardGateway } from '../leaderboard.gateway';

@Injectable()
export class LeaderboardCacheService {
  private readonly logger = new Logger(LeaderboardCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => LeaderboardGateway))
    private readonly leaderboardGateway: LeaderboardGateway,
  ) {}

  async initLeaderboard(data: InitLeaderboardDto): Promise<void> {
    const key = `leaderboard_${data.contestId}`;
    try {
      await this.cacheManager.set(key, data);
      this.logger.log(
        `Initialized leaderboard in cache for contest ${data.contestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize leaderboard cache for contest ${data.contestId}`,
        error.stack,
      );
    }
  }

  async getLeaderboard(contestId: string): Promise<InitLeaderboardDto | null> {
    const key = `leaderboard_${contestId}`;
    try {
      const leaderboard = await this.cacheManager.get<InitLeaderboardDto>(key);
      return leaderboard;
    } catch (error) {
      this.logger.error(
        `Failed to get leaderboard from cache for contest ${contestId}`,
        error.stack,
      );
      return null;
    }
  }

  async updateScore(
    contestId: string,
    userId: string,
    problemId: string,
    score: number,
  ): Promise<void> {
    const key = `leaderboard_${contestId}`;
    let leaderboard: InitLeaderboardDto | null = null;

    try {
      leaderboard = await this.cacheManager.get<InitLeaderboardDto>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get leaderboard from cache during update for contest ${contestId}`,
        error.stack,
      );
      return;
    }

    if (!leaderboard) {
      this.logger.warn(
        `Leaderboard not found in cache for contest ${contestId} during score update.`,
      );
      return;
    }

    let scoreChanged = false;
    const userEntry = leaderboard.users.find((u) => u.user?._id === userId);

    if (userEntry) {
      const problemEntry = userEntry.problems.find(
        (p) => p.problemId === problemId,
      );

      if (problemEntry) {
        if (score > problemEntry.score) {
          this.logger.log(
            `Updating score for user ${userId}, problem ${problemId} in contest ${contestId} from ${problemEntry.score} to ${score}`,
          );
          userEntry.totalScore =
            (userEntry.totalScore || 0) - problemEntry.score + score;
          problemEntry.score = score;
          scoreChanged = true;
        } else {
          this.logger.log(
            `New score ${score} is not higher than existing score ${problemEntry.score} for user ${userId}, problem ${problemId}. No update.`,
          );
        }
      } else {
        this.logger.log(
          `Adding initial score ${score} for user ${userId}, problem ${problemId} in contest ${contestId}`,
        );
        const problemKey = leaderboard.users[0]?.problems?.find(
          (p) => p.problemId === problemId,
        )?.p;
        if (!problemKey) {
          this.logger.error(
            `Could not determine problem key 'p' for problemId ${problemId} in contest ${contestId}. Cannot add score.`,
          );
        } else {
          const newProblemScore: ProblemScoreDto = {
            p: problemKey,
            problemId,
            score,
          };
          userEntry.problems.push(newProblemScore);
          userEntry.totalScore = (userEntry.totalScore || 0) + score;
          scoreChanged = true;
        }
      }
    } else {
      this.logger.warn(
        `User ${userId} not found in leaderboard ${contestId} for score update.`,
      );
      return;
    }

    if (scoreChanged) {
      leaderboard.users.sort(
        (a, b) => (b.totalScore || 0) - (a.totalScore || 0),
      );

      try {
        await this.cacheManager.set(key, leaderboard);
        this.logger.log(`Updated leaderboard cache for contest ${contestId}`);

        this.leaderboardGateway.emitLeaderboardUpdate(contestId, leaderboard);
      } catch (error) {
        this.logger.error(
          `Failed to set leaderboard cache or emit update for contest ${contestId}`,
          error.stack,
        );
      }
    }
  }

  async deleteLeaderboard(contestId: string): Promise<void> {
    const key = `leaderboard_${contestId}`;
    try {
      await this.cacheManager.del(key);
      this.logger.log(
        `Deleted leaderboard from cache for contest ${contestId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete leaderboard cache for contest ${contestId}`,
        error.stack,
      );
    }
  }
}
