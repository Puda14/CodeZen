import { IsNotEmpty, IsEnum } from 'class-validator';
import { LeaderboardStatus } from '../../common/enums/contest.enum';

export class UpdateLeaderboardStatusDto {
  @IsNotEmpty()
  @IsEnum(LeaderboardStatus, { message: 'status must be a valid enum' })
  status: LeaderboardStatus;
}
