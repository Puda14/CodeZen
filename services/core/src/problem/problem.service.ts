import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Problem, ProblemDocument } from './problem.schema';
import { TestcaseService } from '../testcase/testcase.service';
import { ProblemDto } from './dto/problem.dto';
import { ClientSession } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Injectable()
export class ProblemService {
  constructor(
    @InjectModel(Problem.name) private problemModel: Model<ProblemDocument>,
    private testcaseService: TestcaseService,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  async createProblem(problemDto: ProblemDto, session: ClientSession): Promise<ProblemDocument> {
    try {
      const createdTestcases = await this.testcaseService.createTestcases(problemDto.testcases, session);

      const createdProblem = await this.problemModel.create(
        [{ ...problemDto, testcases: createdTestcases.map(tc => tc._id) }],
        { session }
      );

      return createdProblem[0];
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create problem: ${error.message}`);
    }
  }

  async deleteProblem(problemId: string): Promise<void> {
    const problem = await this.problemModel.findById(problemId);
    if (!problem) return;

    if (problem.testcases && problem.testcases.length > 0) {
      await this.testcaseService.deleteTestcases(problem.testcases);
    }

    await this.problemModel.findByIdAndDelete(problemId);
  }

  async checkProblemExists(problemId: string): Promise<boolean> {
    const problem = await this.problemModel.findById(problemId);
    return !!problem;
  }

  async addTestcasesToProblem(problemId: string, testcaseIds: string[]): Promise<void> {
    const objectIds = testcaseIds.map(id => new Types.ObjectId(id));
    await this.problemModel.findByIdAndUpdate(
      problemId,
      { $push: { testcases: { $each: objectIds } } }
    );
  }

  async removeTestcasesFromProblem(problemId: string, testcaseIds: string[]): Promise<void> {
    await this.problemModel.findByIdAndUpdate(
      problemId,
      { $pull: { testcases: { $in: testcaseIds.map(id => new Types.ObjectId(id)) } } }
    );
  }

  async updateProblemData(problemId: string, updateProblemDto: UpdateProblemDto): Promise<void> {
    const problem = await this.problemModel.findById(problemId);
    if (!problem) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    await this.problemModel.findByIdAndUpdate(
      problemId,
      { $set: updateProblemDto }
    );
  }

  async getProblemTestcaseIds(problemId: string): Promise<string[]> {
    const problem = await this.problemModel.findById(problemId).populate('testcases');
    if (!problem) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }
    return problem.testcases.map(tc => tc._id.toString());
  }

  async getProblemWithPublicTestcases(problemId: string): Promise<Problem> {
    const problem = await this.problemModel.findById(problemId)
      .populate({
        path: 'testcases',
        model: 'Testcase',
        transform: (doc) => {
          if (doc.isPublic) {
            return {
              _id: doc._id,
              score: doc.score,
              input: doc.input,
              output: doc.output,
              isPublic: true
            };
          } else {
            return {
              _id: doc._id,
              score: doc.score
            };
          }
        }
      });

    if (!problem) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    return problem;
  }

  async getProblemWithAllTestcases(problemId: string): Promise<Problem> {
    const problem = await this.problemModel.findById(problemId)
      .populate({
        path: 'testcases',
        model: 'Testcase',
        transform: (doc) => {
          return {
            _id: doc._id,
            score: doc.score,
            input: doc.input,
            output: doc.output,
            isPublic: doc.isPublic
          };
        }
      });

    if (!problem) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    return problem;
  }
}
