import { Controller, HttpCode, Post, Body, Get, Param, Request, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardCacheService } from './cache/leaderboard.cache.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly leaderboardCacheService: LeaderboardCacheService,
  ) { }

  @Get(':contestId')
  @UseGuards(JwtAuthGuard)
  async getLeaderboard(@Param('contestId') contestId: string, @Request() req: any) {
    const userId = req.user.userId;

    const leaderboard = await this.leaderboardService.getLeaderboardByContestId(contestId);

    if (!leaderboard) {
      throw new NotFoundException(`Leaderboard for contest ${contestId} not found`);
    }

    const userInLeaderboard = leaderboard.users.find(u => u.user._id === userId);
    if (!userInLeaderboard) {
      throw new ForbiddenException('You are not authorized to view this leaderboard');
    }

    return leaderboard;
  }

  @Post('update')
  @HttpCode(200)
  async updateScore(
    @Body() body: { contestId: string; problemId: string; userId: string; score: number }
  ) {
    const { contestId, userId, problemId, score } = body;
    await this.leaderboardCacheService.updateScore(contestId, userId, problemId, score);
    return { message: 'Leaderboard updated successfully' };
  }
}
