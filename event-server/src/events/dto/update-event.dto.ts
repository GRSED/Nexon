import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import {
  EventGoalType,
  EventStatus,
  EventStatusType,
} from '../schemas/event.schema';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class EventGoalDto {
  @IsEnum(EventGoalType)
  @IsNotEmpty()
  type: EventGoalType;

  @IsNumber()
  @IsNotEmpty()
  count: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsDate()
  @IsOptional()
  startTime?: Date;

  @IsDate()
  @IsOptional()
  endTime?: Date;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatusType;

  @ValidateNested()
  @Type(() => EventGoalDto)
  @IsOptional()
  goal?: EventGoalDto;
}

export class UpdateEventRewardDto {
  @IsArray()
  rewards: Types.ObjectId[];
}
