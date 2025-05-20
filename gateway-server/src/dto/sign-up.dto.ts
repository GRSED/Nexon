import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const UserRole = ['user', 'operator', 'auditor', 'admin'] as const;
export class SignUpDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호 (최소 6자)',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: (typeof UserRole)[number];

  @IsString()
  @IsOptional()
  inviterEmail?: string;
}
