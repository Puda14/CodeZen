import { IsOptional, IsString, IsArray, IsDate, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { ContestStatus, LeaderboardStatus } from '../../common/enums/contest.enum';
import { Type } from 'class-transformer';

export class UpdateContestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_time?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_time?: Date;

  @IsOptional()
  @IsEnum(ContestStatus)
  status?: ContestStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsEnum(LeaderboardStatus)
  leaderboardStatus?: LeaderboardStatus;
}
