import {
  IsString,
  IsMongoId,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class TestcaseResultDto {
  @IsString()
  test_case: string;

  @IsString()
  status: string;

  @IsString()
  output: string;

  @IsOptional()
  @IsString()
  expected?: string;

  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  error_message?: string;

  @IsOptional()
  @IsNumber()
  execution_time?: number;
}

export class SubmissionDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  contest: string;

  @IsMongoId()
  problem: string;

  @IsString()
  code: string;

  @IsString()
  language: string;

  @IsNumber()
  score: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestcaseResultDto)
  testcaseResults: TestcaseResultDto[];
}
