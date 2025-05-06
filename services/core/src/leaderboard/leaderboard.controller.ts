import {
  Controller,
  HttpCode,
  Post,
  Body,
  Get,
  Param,
  Request,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardCacheService } from './cache/leaderboard.cache.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InitLeaderboardDto } from './dto/leaderboard.dto';
import { LeaderboardStatus } from '../common/enums/contest.enum';
import { InternalApiGuard } from '../auth/internal-api.guard';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly leaderboardCacheService: LeaderboardCacheService,
  ) {}

  @Get(':contestId')
  @UseGuards(JwtAuthGuard)
  async getLeaderboard(
    @Param('contestId') contestId: string,
    @Request() req: any,
  ): Promise<LeaderboardWithStatus> {
    const userId = req.user.userId;
    return this.leaderboardService.getLeaderboardForUser(contestId, userId);
  }

  @Post('update')
  @UseGuards(InternalApiGuard)
  @HttpCode(200)
  async updateScore(
    @Body()
    body: {
      contestId: string;
      problemId: string;
      userId: string;
      score: number;
    },
  ) {
    const { contestId, userId, problemId, score } = body;
    await this.leaderboardCacheService.updateScore(
      contestId,
      userId,
      problemId,
      score,
    );
    return { message: 'Leaderboard updated successfully' };
  }

  @Post(':contestId/status')
  @UseGuards(JwtAuthGuard)
  async updateLeaderboardStatus(
    @Param('contestId') contestId: string,
    @Body('status') newStatus: LeaderboardStatus,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.leaderboardService.setContestLeaderboardStatus(
      contestId,
      userId,
      newStatus,
    );
  }

  @Get(':contestId/status')
  async getLeaderboardStatus(
    @Param('contestId') contestId: string,
  ): Promise<{ status: LeaderboardStatus }> {
    const status =
      await this.leaderboardService.getContestLeaderboardStatus(contestId);
    return { status };
  }
}

interface LeaderboardWithStatus extends InitLeaderboardDto {
  leaderboardStatus: LeaderboardStatus;
}
