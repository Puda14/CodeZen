import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Testcase, TestcaseDocument } from './testcase.schema';
import { TestcaseDto } from './dto/testcase.dto';
import { ClientSession, Types } from 'mongoose';

@Injectable()
export class TestcaseService {
  constructor(
    @InjectModel(Testcase.name) private testcaseModel: Model<TestcaseDocument>,
  ) { }

  async createTestcases(testcasesData: TestcaseDto[], session?: ClientSession): Promise<TestcaseDocument[]> {
    try {
      const options = session ? { session, ordered: true } : {};
      const createdTestcases = await this.testcaseModel.create(testcasesData, options);

      if (!createdTestcases || createdTestcases.length === 0) {
        throw new InternalServerErrorException('Failed to create testcases.');
      }
      return createdTestcases;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create testcases: ${error.message}`);
    }
  }

  async deleteTestcases(testcaseIds: Types.ObjectId[]): Promise<void> {
    await this.testcaseModel.deleteMany({ _id: { $in: testcaseIds } });
  }

  async updateTestcase(testcaseId: string, updateData: Partial<TestcaseDto>): Promise<void> {
    const testcase = await this.testcaseModel.findById(testcaseId);
    if (!testcase) {
      throw new NotFoundException(`Testcase with ID ${testcaseId} not found`);
    }

    await this.testcaseModel.findByIdAndUpdate(
      testcaseId,
      { $set: updateData }
    );
  }
}
