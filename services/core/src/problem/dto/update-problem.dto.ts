import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Difficulty } from '../../common/enums/difficulty.enum';
import { Tags } from '../../common/enums/tags.enum';
import { UpdateTestcaseDto } from '../../testcase/dto/update-testcase.dto';
import { Type } from 'class-transformer';
import { AppConfig } from '../../config/app.config';

export class UpdateProblemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(AppConfig.problem.minSubmissions)
  @Max(AppConfig.problem.maxSubmissions)
  maxSubmissions?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(Tags, { each: true })
  tags?: Tags[];
}
