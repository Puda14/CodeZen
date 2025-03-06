import { IsNotEmpty, IsString, IsArray, IsEnum, ValidateNested, } from 'class-validator';
import { Difficulty } from '../../common/enums/difficulty.enum';
import { Tags } from '../../common/enums/tags.enum';
import { TestcaseDto } from '../../testcase/dto/testcase.dto';
import { Type } from 'class-transformer';

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestcaseDto)
  testcases: TestcaseDto[];
}
