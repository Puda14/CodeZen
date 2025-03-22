import { Test, TestingModule } from '@nestjs/testing';
import { TestcaseController } from './testcase.controller';

describe('TestcaseController', () => {
  let controller: TestcaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestcaseController],
    }).compile();

    controller = module.get<TestcaseController>(TestcaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
