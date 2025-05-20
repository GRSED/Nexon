import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ConfigService } from '@nestjs/config';

export const UserRole = ['user', 'operator', 'auditor', 'admin'] as const;
export type UserRoleType = (typeof UserRole)[number];

@Schema({ collection: 'users' })
export class User extends Document {
  _id: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  salt: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: 'user',
  })
  role: UserRoleType;

  @Prop({ required: true, default: 0 })
  point: number;

  @Prop({ required: true, default: 0 })
  drawCount: number;

  @Prop({ required: true, default: 1 })
  attendanceCount: number;

  @Prop({ required: true, default: [] })
  inviteList: string[];

  @Prop({ type: Number, default: 0 })
  tokenVersion: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  lastLoginAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// ConfigService를 사용하여 환경에 따라 인덱스 옵션 설정
const configService = new ConfigService();
const indexOptions =
  configService.get('NODE_ENV') === 'production' ? { background: true } : {};

UserSchema.index({ email: 1 }, { ...indexOptions, unique: true });
UserSchema.index({ role: 1 }, indexOptions);
