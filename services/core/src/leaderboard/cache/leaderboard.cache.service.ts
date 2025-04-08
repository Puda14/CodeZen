import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InitLeaderboardDto, LeaderboardUserDto } from '../dto/leaderboard.dto';

@Injectable()
export class LeaderboardCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async initLeaderboard(data: InitLeaderboardDto): Promise<void> {
    const key = `leaderboard_${data.contestId}`;
    await this.cacheManager.set(key, data);
  }

  async getLeaderboard(contestId: string): Promise<InitLeaderboardDto | null> {
    const key = `leaderboard_${contestId}`;
    return await this.cacheManager.get<InitLeaderboardDto>(key);
  }

  async updateScore(contestId: string, userId: string, problemId: string, score: number): Promise<void> {
    const key = `leaderboard_${contestId}`;
    const leaderboard = await this.cacheManager.get<InitLeaderboardDto>(key);
    if (!leaderboard) return;

    const userEntry = leaderboard.users.find(u => u.user._id === userId);
    if (!userEntry) return;

    const problemEntry = userEntry.problems.find(p => p.problemId === problemId);
    if (problemEntry) {
      if (score > problemEntry.score) {
        userEntry.totalScore += score - problemEntry.score;
        problemEntry.score = score;
      }
    } else {
      userEntry.problems.push({ problemId, score });
      userEntry.totalScore += score;
    }

    await this.cacheManager.set(key, leaderboard);
  }

  async deleteLeaderboard(contestId: string): Promise<void> {
    await this.cacheManager.del(`leaderboard_${contestId}`);
  }
}
