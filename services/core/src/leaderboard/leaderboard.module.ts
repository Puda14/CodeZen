import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Leaderboard, LeaderboardSchema } from './leaderboard.schema';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardCacheService } from './cache/leaderboard.cache.service';
import { LeaderboardGateway } from './leaderboard.gateway';
import { ContestModule } from '../contest/contest.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Leaderboard.name, schema: LeaderboardSchema },
    ]),
    forwardRef(() => ContestModule),
  ],
  providers: [LeaderboardService, LeaderboardCacheService, LeaderboardGateway],
  controllers: [LeaderboardController],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
