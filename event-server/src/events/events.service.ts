import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from './repositories/event.repository';
import { Event, EventGoal, EventStatusType } from './schemas/event.schema';
import { RewardRepository } from './repositories/reward.repository';
import { RewardRequestRepository } from './repositories/reward-request.repository';
import { UpdateRewardDto } from './dto/update-reward.dto';
import {
  Reward,
  RewardRequest,
  RewardRequestStatusType,
  RewardType,
} from './schemas/reward.schema';

@Injectable()
export class EventsService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly rewardRepository: RewardRepository,
    private readonly rewardRequestRepository: RewardRequestRepository,
  ) {}

  async getAllEvents(): Promise<Event[]> {
    return this.eventRepository.findAll();
  }

  async getEvent(args: { eventId: string }): Promise<Event> {
    const { eventId } = args;
    const event = await this.eventRepository.findOne(eventId);
    if (!event) {
      throw new NotFoundException('EVENT.NOT_FOUND');
    }
    return event;
  }

  async createEvent(args: {
    title: string;
    startTime: Date;
    endTime: Date;
    goal: EventGoal;
    status?: EventStatusType;
  }): Promise<Event> {
    const { title, startTime, endTime, goal, status } = args;
    return this.eventRepository.createEvent({
      title,
      startTime,
      endTime,
      goal,
      status,
    });
  }

  async updateEvent(args: {
    eventId: string;
    title?: string;
    startTime?: Date;
    endTime?: Date;
    goal?: EventGoal;
    status?: EventStatusType;
  }): Promise<Event> {
    const { eventId, title, startTime, endTime, goal, status } = args;
    const event = await this.eventRepository.updateEvent(eventId, {
      title,
      startTime,
      endTime,
      goal,
      status,
    });
    if (!event) {
      throw new NotFoundException('EVENT.NOT_FOUND');
    }
    return event;
  }

  async createReward(args: {
    eventId: string;
    type: RewardType;
    quantity: number;
  }): Promise<Reward> {
    const { eventId, type, quantity } = args;
    const event = await this.getEvent({ eventId });
    if (!event) {
      throw new NotFoundException('EVENT.NOT_FOUND');
    }
    const reward = await this.rewardRepository.createReward({
      type,
      quantity,
      eventId,
    });
    await this.eventRepository.updateEventRewards(eventId, {
      rewards: event.rewards.includes(reward._id)
        ? event.rewards
        : [...event.rewards, reward._id],
    });
    return reward;
  }

  async updateReward(args: {
    rewardId: string;
    updateRewardDto: UpdateRewardDto;
  }): Promise<Reward> {
    const { rewardId, updateRewardDto } = args;
    const reward = await this.rewardRepository.updateReward(
      rewardId,
      updateRewardDto,
    );
    if (!reward) {
      throw new NotFoundException('REWARD.NOT_FOUND');
    }
    return reward;
  }

  async deleteReward(args: {
    eventId: string;
    rewardId: string;
  }): Promise<void> {
    const { eventId, rewardId } = args;
    const event = await this.getEvent({ eventId });
    if (!event) {
      throw new NotFoundException('EVENT.NOT_FOUND');
    }
    const reward = await this.rewardRepository.deleteReward(rewardId);
    if (!reward) {
      throw new NotFoundException('REWARD.NOT_FOUND');
    }
    await this.eventRepository.updateEventRewards(eventId, {
      rewards: event.rewards.filter((id) => id !== reward._id),
    });
    return;
  }

  async getRewardRequests(args: {
    filter: {
      eventId?: string;
      status?: RewardRequestStatusType;
    };
  }): Promise<RewardRequest[]> {
    const { filter } = args;
    const { eventId, status } = filter;
    if (eventId) {
      return this.rewardRequestRepository.findByEventId(eventId);
    }
    if (status) {
      return this.rewardRequestRepository.findByStatus(status);
    }
    return this.rewardRequestRepository.findAll();
  }

  async getUserRewardRequests(args: {
    userId: string;
  }): Promise<RewardRequest[]> {
    const { userId } = args;
    return this.rewardRequestRepository.findByUserId(userId);
  }

  async createRewardRequest(args: {
    eventId: string;
    userId: string;
    status: RewardRequestStatusType;
  }): Promise<void> {
    const { eventId, userId, status } = args;
    const event = await this.getEvent({ eventId });
    if (!event) {
      throw new NotFoundException('EVENT.NOT_FOUND');
    }
    if (event.status === 'inactive') {
      throw new BadRequestException('EVENT.INACTIVE');
    }
    const rewardIds = event.rewards.map((reward) => reward._id.toString());
    await Promise.all(
      rewardIds.map((rewardId) =>
        this.rewardRequestRepository.createRewardRequest({
          eventId,
          rewardId,
          userId,
          status,
        }),
      ),
    );
    return;
  }

  async checkEventGoalDuplicated(args: {
    eventId: string;
    userId: string;
  }): Promise<RewardRequestStatusType> {
    const { eventId, userId } = args;
    return this.rewardRequestRepository.checkEventGoalDuplicated(
      userId,
      eventId,
    );
  }
}
