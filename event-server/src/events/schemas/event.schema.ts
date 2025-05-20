import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';

export const EventStatus = ['active', 'inactive'] as const;
export type EventStatusType = (typeof EventStatus)[number];

export const EventGoalType = ['invite', 'attendance'] as const;
export type EventGoalType = (typeof EventGoalType)[number];

@Schema({ _id: false })
export class EventGoal {
  @Prop({ required: true, enum: EventGoalType })
  type: EventGoalType;

  @Prop({ required: true })
  count: number;

  @Prop()
  description: string;
}

@Schema({ collection: 'events' })
export class Event extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({
    required: true,
    enum: EventStatus,
    default: 'inactive',
  })
  status: EventStatusType;

  @Prop({ type: EventGoal, required: true })
  goal: EventGoal;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Reward' }] })
  rewards: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// ConfigService를 사용하여 환경에 따라 인덱스 옵션 설정
const configService = new ConfigService();
const indexOptions =
  configService.get('NODE_ENV') === 'production' ? { background: true } : {};

EventSchema.index({ startTime: 1 }, indexOptions);
EventSchema.index({ status: 1 }, indexOptions);
