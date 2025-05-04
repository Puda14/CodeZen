import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Difficulty } from '../../common/enums/difficulty.enum';
import { Tags } from '../../common/enums/tags.enum';
import { TestcaseDto } from '../../testcase/dto/testcase.dto';
import { Type } from 'class-transformer';
import { AppConfig } from '../../config/app.config';

export class ProblemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsArray()
  @IsEnum(Tags, { each: true })
  tags: Tags[];

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(AppConfig.problem.minSubmissions)
  @Max(AppConfig.problem.maxSubmissions)
  maxSubmissions: number = AppConfig.problem.defaultSubmissions;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestcaseDto)
  testcases: TestcaseDto[];
}
