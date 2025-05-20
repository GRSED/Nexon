import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserRoleType } from '../schemas/user.schema';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  salt: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRoleType;
}
