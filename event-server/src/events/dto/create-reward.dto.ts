import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { RewardType } from '../schemas/reward.schema';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsEnum(RewardType)
  @IsNotEmpty()
  type: RewardType;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
