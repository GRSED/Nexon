import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RewardRequest,
  RewardRequestStatusType,
} from '../schemas/reward.schema';
import { CreateRewardRequestDto } from '../dto/create-reward-request.dto';

@Injectable()
export class RewardRequestRepository {
  constructor(
    @InjectModel(RewardRequest.name)
    private readonly rewardRequestModel: Model<RewardRequest>,
  ) {}

  async findAll(): Promise<RewardRequest[]> {
    return this.rewardRequestModel
      .find()
      .populate('eventId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByEventId(eventId: string): Promise<RewardRequest[]> {
    return this.rewardRequestModel
      .find({ eventId })
      .populate('eventId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserId(userId: string): Promise<RewardRequest[]> {
    return this.rewardRequestModel
      .find({ userId })
      .populate('eventId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(
    status: RewardRequestStatusType,
  ): Promise<RewardRequest[]> {
    return this.rewardRequestModel
      .find({ status })
      .populate('eventId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async checkEventGoalDuplicated(
    userId: string,
    eventId: string,
  ): Promise<RewardRequestStatusType> {
    const rewardRequest = await this.rewardRequestModel.findOne({
      eventId,
      userId,
      status: 'success',
    });
    if (rewardRequest) {
      return 'duplicate';
    }
    return 'success';
  }

  async createRewardRequest(
    createRewardRequestDto: CreateRewardRequestDto,
  ): Promise<RewardRequest> {
    return this.rewardRequestModel.create(createRewardRequestDto);
  }
}
