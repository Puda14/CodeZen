import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { MongooseConfigService } from './config/mongoose-config.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ContestModule } from './contest/contest.module';
import { ProblemModule } from './problem/problem.module';
import { TestcaseModule } from './testcase/testcase.module';

import { BullModule } from '@nestjs/bullmq';
import { RedisHealthIndicator } from './common/health/redis.health';
import { HealthController } from './common/health/health.controller';
import { TerminusModule } from '@nestjs/terminus';

import { CacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import { createKeyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';

import { Logger } from '@nestjs/common';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { SubmissionModule } from './submission/submission.module';
import { AppConfigModule } from './config/app-config.module';

@Module({
  imports: [
    AppConfigModule,

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),

    UserModule,

    AuthModule,

    ContestModule,

    ProblemModule,

    TestcaseModule,

    ScheduleModule.forRoot(),

    TerminusModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'redis',
        port: 6379,
        maxRetriesPerRequest: null,
      },
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisStore = createKeyv('redis://redis:6379');
        const memoryStore = new Keyv({ store: new CacheableMemory() });

        const logger = new Logger('CacheModule');
        logger.log(
          `✅ Using Redis store: ${redisStore.opts.store?.constructor.name}`,
        );
        logger.log(
          `✅ Using Memory store: ${memoryStore.opts.store?.constructor.name}`,
        );

        return {
          stores: [redisStore, memoryStore],
        };
      },
    }),

    LeaderboardModule,

    SubmissionModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, RedisHealthIndicator],
})
export class AppModule {}
