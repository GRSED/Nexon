import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../users/repositories/user.repository';
import { User, UserRole, UserRoleType } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(args: {
    email: string;
    password: string;
    role?: UserRoleType;
    inviterEmail?: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password, role, inviterEmail } = args;
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('AUTH.EMAIL_ALREADY_EXISTS');
    }

    const inviter = inviterEmail
      ? await this.userRepository.findByEmail(inviterEmail)
      : null;
    if (inviter && !inviter.inviteList.includes(inviter._id)) {
      await this.userRepository.updateUser(inviter._id, {
        inviteList: [...inviter.inviteList, inviter._id],
      });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.userRepository.createUser({
      email,
      password: hashedPassword,
      salt,
      role,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  async login(args: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = args;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
    }

    const hashedPassword = await bcrypt.hash(password, user.salt);
    if (hashedPassword !== user.password) {
      throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
    }

    const now = new Date();
    const isNewDay =
      user.lastLoginAt.getDate() !== now.getDate() ||
      user.lastLoginAt.getMonth() !== now.getMonth() ||
      user.lastLoginAt.getFullYear() !== now.getFullYear();

    await this.userRepository.updateUser(user._id, {
      lastLoginAt: now,
      $inc: {
        attendanceCount: isNewDay ? 1 : 0,
      },
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  async updateRole(args: {
    userId: string;
    role: UserRoleType;
  }): Promise<void> {
    const { userId, role } = args;
    if (!UserRole.includes(role)) {
      throw new BadRequestException('AUTH.INVALID_ROLE');
    }
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    if (user.role === role) {
      throw new ConflictException('AUTH.ROLE_ALREADY_SET');
    }

    await this.userRepository.updateUser(user._id, {
      role,
      $inc: { tokenVersion: 1 },
    });
    return;
  }

  async refreshAccessToken(args: {
    accessToken: string;
    userId: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const { accessToken, userId } = args;
    const payload = this.jwtService.verify(accessToken);
    if (payload?.sub !== userId) {
      throw new UnauthorizedException('AUTH.INVALID_TOKEN');
    }
    const updatedUser = await this.userRepository.updateUser(
      payload?.sub ?? userId,
      {
        $inc: { tokenVersion: 1 },
      },
    );

    if (!updatedUser) {
      throw new UnauthorizedException('AUTH.INVALID_REFRESH_TOKEN');
    }

    const newAccessToken = this.generateAccessToken(updatedUser);
    const newRefreshToken = this.generateRefreshToken(updatedUser);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(args: { userId: string }): Promise<void> {
    const { userId } = args;
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    await this.userRepository.updateUser(userId, {
      $inc: { tokenVersion: 1 },
    });
    return;
  }

  async getUser(args: { userId: string }): Promise<{
    id: string;
    email: string;
    role: UserRoleType;
    point: number;
    drawCount: number;
    attendanceCount: number;
    inviteCount: number;
  }> {
    const { userId } = args;
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    const {
      _id: id,
      email,
      role,
      point,
      drawCount,
      attendanceCount,
      inviteList,
    } = user;
    return {
      id,
      email,
      role,
      point,
      drawCount,
      attendanceCount,
      inviteCount: inviteList.length,
    };
  }

  async updateUserPointDrawCount(args: {
    userId: string;
    point?: number;
    drawCount?: number;
  }): Promise<void> {
    const { userId, point, drawCount } = args;
    if (point) {
      await this.userRepository.updateUser(userId, {
        $inc: { point },
      });
    }
    if (drawCount) {
      await this.userRepository.updateUser(userId, {
        $inc: { drawCount },
      });
    }
    return;
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user._id,
      role: user.role,
      version: user.tokenVersion,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION', '15m'),
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user._id,
      version: user.tokenVersion,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION', '30d'),
    });
  }
}
