import { IsString, IsEnum, IsOptional, IsDate, IsArray } from 'class-validator';
import { UserRoleType, UserRole } from '../schemas/user.schema';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  salt?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRoleType;

  @IsOptional()
  @IsArray()
  inviteList?: string[];

  @IsOptional()
  @IsDate()
  lastLoginAt?: Date;
}
