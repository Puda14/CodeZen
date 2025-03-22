import { IsOptional, IsString, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Difficulty } from '../../common/enums/difficulty.enum';
import { Tags } from '../../common/enums/tags.enum';
import { UpdateTestcaseDto } from '../../testcase/dto/update-testcase.dto';
import { Type } from 'class-transformer';

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
  @IsArray()
  @IsEnum(Tags, { each: true })
  tags?: Tags[];
}
