import { IsNotEmpty, IsString, IsBoolean, IsNumber } from 'class-validator';

export class TestcaseDto {
  @IsNotEmpty()
  @IsString()
  input: string;

  @IsNotEmpty()
  @IsString()
  output: string;

  @IsNotEmpty()
  @IsNumber()
  score: number;

  @IsNotEmpty()
  @IsBoolean()
  isPublic: boolean;
}
