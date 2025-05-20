import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import {
  RewardRequestStatus,
  RewardRequestStatusType,
} from '../schemas/reward.schema';

export class CreateRewardRequestDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  rewardId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(RewardRequestStatus)
  @IsNotEmpty()
  status: RewardRequestStatusType;
}
