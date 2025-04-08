import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Leaderboard, LeaderboardSchema } from './leaderboard.schema';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardCacheService } from './cache/leaderboard.cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Leaderboard.name, schema: LeaderboardSchema }
    ])
  ],
  providers: [LeaderboardService, LeaderboardCacheService],
  controllers: [LeaderboardController],
  exports: [LeaderboardService],
})
export class LeaderboardModule { }
