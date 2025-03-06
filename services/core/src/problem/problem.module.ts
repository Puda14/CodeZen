import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProblemService } from './problem.service';
import { Problem, ProblemSchema } from './problem.schema';
import { TestcaseModule } from '../testcase/testcase.module';
import { ProblemController } from './problem.controller';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Problem.name, schema: ProblemSchema }]),
    TestcaseModule,
  ],
  providers: [ProblemService],
  exports: [ProblemService],
  controllers: [ProblemController],
})
export class ProblemModule { }
