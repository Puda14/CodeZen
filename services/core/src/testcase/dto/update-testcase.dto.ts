import { IsOptional, IsString, IsBoolean, IsNumber, IsNotEmpty } from 'class-validator';

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
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
