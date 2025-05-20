import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { RewardType } from '../schemas/reward.schema';

export class UpdateRewardDto {
  @IsEnum(RewardType)
  @IsOptional()
  type?: RewardType;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}
