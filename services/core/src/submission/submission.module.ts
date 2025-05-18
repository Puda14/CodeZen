import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Submission, SubmissionSchema } from './submission.schema';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { ContestModule } from '../contest/contest.module';
import { ProblemModule } from '../problem/problem.module';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
    ]),
    ContestModule,
    ProblemModule,
    AuthModule,
    HttpModule,
    ConfigModule,
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService],
  exports: [SubmissionService],
})
export class SubmissionModule {}
