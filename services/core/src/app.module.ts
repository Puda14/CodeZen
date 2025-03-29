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
// import { Keyv } from 'keyv';
// import KeyvRedis from '@keyv/redis';
// import { createKeyv } from '@keyv/redis';
// import { ConfigService } from '@nestjs/config';
// import { CacheableMemory } from 'cacheable';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
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
      }
    }),

    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   useFactory: async () => {
    //     return {
    //       stores: [
    //         createKeyv('redis://redis:6379'),
    //         // new Keyv({
    //         //   store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
    //         // }),
    //       ],
    //     };
    //   },
    // }),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: 'redis',
        port: 6379,
        ttl: 600,
      })
    })
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, RedisHealthIndicator],
})
export class AppModule { }
