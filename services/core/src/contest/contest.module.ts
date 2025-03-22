import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContestService } from './contest.service';
import { ContestController } from './contest.controller';
import { Contest, ContestSchema } from './contest.schema';
import { ProblemModule } from '../problem/problem.module';
import { TestcaseModule } from '../testcase/testcase.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contest.name, schema: ContestSchema }]),
    ProblemModule,
    TestcaseModule,
    UserModule,
  ],
  providers: [ContestService],
  controllers: [ContestController],
  exports: [ContestService],
})
export class ContestModule { }
