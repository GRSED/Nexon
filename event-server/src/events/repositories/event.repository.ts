import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from '../schemas/event.schema';
import { CreateEventDto } from '../dto/create-event.dto';
import {
  UpdateEventDto,
  UpdateEventRewardDto as UpdateEventRewardsDto,
} from '../dto/update-event.dto';

@Injectable()
export class EventRepository {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
  ) {}

  async findAll(): Promise<Event[]> {
    return this.eventModel
      .find()
      .sort({ startTime: -1 })
      .populate('rewards')
      .exec();
  }

  async findOne(id: string): Promise<Event> {
    return this.eventModel.findById(id).populate('rewards').exec();
  }

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    return this.eventModel.create(createEventDto);
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<Event | null> {
    return this.eventModel
      .findByIdAndUpdate(
        id,
        {
          ...updateEventDto,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .populate('rewards')
      .exec();
  }

  async updateEventRewards(
    id: string,
    updateEventRewardDto: UpdateEventRewardsDto,
  ): Promise<Event | null> {
    return this.eventModel
      .findByIdAndUpdate(
        id,
        { ...updateEventRewardDto, updatedAt: new Date() },
        { new: true },
      )
      .populate('rewards')
      .exec();
  }
}
