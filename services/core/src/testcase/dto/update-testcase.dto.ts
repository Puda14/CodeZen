import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppConfig } from '../../config/app.config';

export class UpdateTestcaseDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  input?: string;

  @IsOptional()
  @IsString()
  output?: string;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 })
  score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 })
  @Min(AppConfig.testcase.timeout.min)
  @Max(AppConfig.testcase.timeout.max)
  timeout?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
