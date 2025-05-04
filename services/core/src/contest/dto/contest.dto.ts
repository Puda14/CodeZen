import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsDate,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { ProblemDto } from '../../problem/dto/problem.dto';
import {
  ContestStatus,
  LeaderboardStatus,
} from '../../common/enums/contest.enum';
import { Type } from 'class-transformer';

export class ContestDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  start_time: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  end_time: Date;

  @IsNotEmpty()
  @IsEnum(ContestStatus)
  status?: ContestStatus;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsBoolean()
  isPublic: boolean;

  @IsNotEmpty()
  @IsEnum(LeaderboardStatus)
  leaderboardStatus: LeaderboardStatus;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemDto)
  problems: ProblemDto[];
}
