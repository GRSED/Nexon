import { ConfigService } from '@nestjs/config';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const RewardType = ['point', 'drawCount'] as const;
export type RewardType = (typeof RewardType)[number];

export const RewardRequestStatus = ['success', 'failed', 'duplicate'] as const;
export type RewardRequestStatusType = (typeof RewardRequestStatus)[number];

@Schema({ collection: 'rewards' })
export class Reward extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true, enum: RewardType })
  type: RewardType;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

@Schema({ collection: 'reward_requests' })
export class RewardRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ required: true })
  rewardId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: RewardRequestStatus })
  status: RewardRequestStatusType;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);

// ConfigService를 사용하여 환경에 따라 인덱스 옵션 설정
const configService = new ConfigService();
const indexOptions =
  configService.get('NODE_ENV') === 'production' ? { background: true } : {};

RewardSchema.index({ eventId: 1, type: 1 }, { ...indexOptions, unique: true });

RewardRequestSchema.index({ eventId: 1 }, indexOptions);
RewardRequestSchema.index({ userId: 1 }, indexOptions);
RewardRequestSchema.index({ status: 1 }, indexOptions);
RewardRequestSchema.index({ createdAt: -1 }, indexOptions);
