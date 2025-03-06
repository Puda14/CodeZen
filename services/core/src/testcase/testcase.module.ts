import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestcaseService } from './testcase.service';
import { Testcase, TestcaseSchema } from './testcase.schema';
import { TestcaseController } from './testcase.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Testcase.name, schema: TestcaseSchema }])
  ],
  providers: [TestcaseService],
  exports: [TestcaseService],
  controllers: [TestcaseController]
})
export class TestcaseModule { }
