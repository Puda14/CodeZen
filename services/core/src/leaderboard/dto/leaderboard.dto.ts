import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LeaderboardUserInfoDto {
  @IsString()
  _id: string;

  @IsString()
  username: string;

  @IsString()
  email: string;
}

export class ProblemScoreDto {
  @IsString()
  p: string;

  @IsString()
  problemId: string;

  @IsNumber()
  score: number;
}

export class LeaderboardUserDto {
  @ValidateNested()
  @Type(() => LeaderboardUserInfoDto)
  user: LeaderboardUserInfoDto;

  @IsNumber()
  totalScore: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemScoreDto)
  problems: ProblemScoreDto[];
}

export class InitLeaderboardDto {
  @IsString()
  contestId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeaderboardUserDto)
  users: LeaderboardUserDto[];
}
