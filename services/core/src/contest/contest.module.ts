import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContestService } from './contest.service';
import { ContestController } from './contest.controller';
import { Contest, ContestSchema } from './contest.schema';
import { ProblemModule } from '../problem/problem.module';
import { TestcaseModule } from '../testcase/testcase.module';
import { UserModule } from '../user/user.module';
import { ContestStatusGuard } from './contest-status.guard';

import { BullModule } from '@nestjs/bullmq';
import { QueueController } from './queue/queue.controller';
import { ContestQueueService } from './queue/contest.queue.service';
import { ContestProcessor } from './queue/contest.processor';

import { ContestCacheService } from './cache/contest.cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contest.name, schema: ContestSchema }]),
    ProblemModule,
    TestcaseModule,
    UserModule,
    BullModule.registerQueue({
      name: 'contestQueue',
      connection: {
        host: 'localhost',
        port: 6380,
      },
    }),
  ],
  providers: [
    ContestService,
    ContestStatusGuard,
    ContestQueueService,
    ContestProcessor,
    ContestCacheService,
  ],
  controllers: [ContestController, QueueController],
  exports: [ContestService, ContestCacheService],
})
export class ContestModule { }
