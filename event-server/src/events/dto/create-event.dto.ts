import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EventGoalType,
  EventStatus,
  EventStatusType,
} from '../schemas/event.schema';

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

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endTime: Date;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatusType;

  @ValidateNested()
  @Type(() => EventGoalDto)
  @IsNotEmpty()
  goal: EventGoalDto;
}
