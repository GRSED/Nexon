import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reward } from '../schemas/reward.schema';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { UpdateRewardDto } from '../dto/update-reward.dto';

@Injectable()
export class RewardRepository {
  constructor(
    @InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
  ) {}

  async findByEventId(eventId: string): Promise<Reward[]> {
    return this.rewardModel.find({ eventId }).exec();
  }

  async createReward(createRewardDto: CreateRewardDto): Promise<Reward> {
    return this.rewardModel.create(createRewardDto);
  }

  async updateReward(
    id: string,
    updateRewardDto: UpdateRewardDto,
  ): Promise<Reward | null> {
    return this.rewardModel
      .findByIdAndUpdate(
        id,
        {
          ...updateRewardDto,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async deleteReward(id: string): Promise<Reward | null> {
    return this.rewardModel.findByIdAndDelete(id).exec();
  }
}
