import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppConfig } from '../../config/app.config';

export class TestcaseDto {
  @IsNotEmpty()
  @IsString()
  input: string;

  @IsNotEmpty()
  @IsString()
  output: string;

  @IsNotEmpty()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 })
  score: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 })
  @Min(AppConfig.testcase.timeout.min)
  @Max(AppConfig.testcase.timeout.max)
  timeout: number = AppConfig.testcase.timeout.default;

  @IsNotEmpty()
  @IsBoolean()
  isPublic: boolean;
}
