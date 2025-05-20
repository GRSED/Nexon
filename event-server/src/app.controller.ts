import {
  BadRequestException,
  Controller,
  HttpException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventsService } from './events/events.service';
import { EventGoal, EventStatusType } from './events/schemas/event.schema';
import { RewardType } from './events/schemas/reward.schema';
import { RewardRequestStatusType } from './events/schemas/reward.schema';
import { UpdateRewardDto } from './events/dto/update-reward.dto';
import { catchError, of } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class AppController {
  constructor(
    private readonly eventsService: EventsService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'events.get_all_events' })
  async getAllEvents(
    @Payload()
    data: {
      role: string;
    },
  ) {
    const result = await this.eventsService.getAllEvents();
    if (data.role === 'user') {
      return of(result.filter((event) => event.status === 'active'));
    }
    return of(result);
  }

  @MessagePattern({ cmd: 'events.get_event' })
  async getEvent(@Payload() data: { eventId: string }) {
    const result = await this.eventsService.getEvent(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'events.create_event' })
  async createEvent(
    @Payload()
    data: {
      title: string;
      startTime: Date;
      endTime: Date;
      goal: EventGoal;
      status?: EventStatusType;
    },
  ) {
    const result = await this.eventsService.createEvent(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'events.update_event' })
  async updateEvent(
    @Payload()
    data: {
      eventId: string;
      title?: string;
      startTime?: Date;
      endTime?: Date;
      goal?: EventGoal;
      status?: EventStatusType;
    },
  ) {
    const result = await this.eventsService.updateEvent(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'events.create_reward' })
  async createReward(
    @Payload()
    data: {
      eventId: string;
      type: RewardType;
      quantity: number;
    },
  ) {
    const result = await this.eventsService.createReward(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'events.update_reward' })
  async updateReward(
    @Payload()
    data: {
      rewardId: string;
      updateRewardDto: UpdateRewardDto;
    },
  ) {
    const result = await this.eventsService.updateReward(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'events.delete_reward' })
  async deleteReward(
    @Payload()
    data: {
      eventId: string;
      rewardId: string;
    },
  ) {
    await this.eventsService.deleteReward(data);
    return of({ success: true });
  }

  @MessagePattern({ cmd: 'events.get_reward_requests' })
  async getRewardRequests(
    @Payload()
    data: {
      filter: {
        eventId?: string;
        status?: RewardRequestStatusType;
      };
    },
  ) {
    const result = await this.eventsService.getRewardRequests(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'events.get_user_reward_requests' })
  async getUserRewardRequests(@Payload() data: { userId: string }) {
    const result = await this.eventsService.getUserRewardRequests(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'events.request_reward' })
  async requestReward(
    @Payload()
    data: {
      eventId: string;
      userId: string;
    },
  ) {
    const { eventId, userId } = data;

    const event = await this.eventsService.getEvent({ eventId });

    if (!event || event.status === 'inactive') {
      throw new NotFoundException('EVENT.NOT_FOUND');
    }

    const rewards = event.rewards;

    if (rewards.length === 0) {
      throw new BadRequestException('EVENT.NO_REWARD');
    }

    const rewardSummary = rewards.reduce(
      (acc, reward) => {
        if ('type' in reward && 'quantity' in reward) {
          const { type, quantity } = reward as {
            type: RewardType;
            quantity: number;
          };
          acc[type] = (acc[type] || 0) + quantity;
        }
        return acc;
      },
      {} as Record<RewardType, number>,
    );
    const user = await firstValueFrom(
      this.authClient.send({ cmd: 'auth.get-user' }, { userId }).pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      ),
    );

    let isAchieved = false;
    switch (event.goal.type) {
      case 'attendance':
        isAchieved = user.attendanceCount >= event.goal.count;
        break;
      case 'invite':
        isAchieved = user.inviteCount >= event.goal.count;
        break;
    }
    let status: RewardRequestStatusType = isAchieved ? 'success' : 'failed';
    if (isAchieved) {
      status = await this.eventsService.checkEventGoalDuplicated({
        eventId,
        userId,
      });
    }
    await this.eventsService.createRewardRequest({
      eventId,
      userId,
      status,
    });
    if (status === 'success') {
      await firstValueFrom(
        this.authClient
          .send(
            { cmd: 'auth.update-user-point-draw-count' },
            {
              userId,
              ...rewardSummary,
            },
          )
          .pipe(
            catchError((error) => {
              throw new HttpException(
                error.message,
                error?.error?.status ?? 500,
              );
            }),
          ),
      );
    }

    return of({ status });
  }
}
