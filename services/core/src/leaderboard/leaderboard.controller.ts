import { Controller, Get, Param, Request, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) { }

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
}
