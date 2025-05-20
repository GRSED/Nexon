import {
  Controller,
  Post,
  Body,
  Inject,
  Put,
  Param,
  HttpException,
  UseGuards,
  Request,
  Get,
  Delete,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SignUpDto } from './dto/sign-up.dto';
import { LogInDto } from './dto/login.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { Roles, UserRole } from './auth/guards/roles.decorator';
import { RolesGuard } from './auth/guards/roles.guard';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @Post('users/signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authClient.send({ cmd: 'auth.signup' }, signUpDto).pipe(
      catchError((error) => {
        throw new HttpException(error.message, error?.error?.status ?? 500);
      }),
    );
  }

  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @Post('users/login')
  async login(@Body() loginDto: LogInDto) {
    return this.authClient.send({ cmd: 'auth.login' }, loginDto).pipe(
      catchError((error) => {
        throw new HttpException(error.message, error?.error?.status ?? 500);
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard)
  @Post('users/refresh-access-token')
  async refreshAccessToken(
    @Request() req,
    @Body() accessTokenDto: AccessTokenDto,
  ) {
    return this.authClient
      .send(
        { cmd: 'auth.refresh-access-token' },
        { ...accessTokenDto, ...req.user },
      )
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard)
  @Post('users/logout')
  async logout(@Request() req) {
    return this.authClient.send({ cmd: 'auth.logout' }, req.user).pipe(
      catchError((error) => {
        throw new HttpException(error.message, error?.error?.status ?? 500);
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 역할 업데이트' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role'],
      properties: {
        role: {
          type: 'string',
          enum: ['user', 'operator', 'auditor', 'admin'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '역할 업데이트 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('users/:id/role')
  async updateRole(
    @Param('id') id: string,
    @Body()
    updateRoleDto: {
      role: 'user' | 'operator' | 'auditor' | 'admin';
    },
  ) {
    return this.authClient
      .send({ cmd: 'auth.update-role' }, { userId: id, ...updateRoleDto })
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard)
  @Get('users/me')
  async getCurrentUser(@Request() req) {
    return this.authClient.send({ cmd: 'auth.get-user' }, req.user).pipe(
      catchError((error) => {
        throw new HttpException(error.message, error?.error?.status ?? 500);
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '모든 이벤트 조회' })
  @ApiResponse({ status: 200, description: '이벤트 목록 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard)
  @Get('events')
  async getAllEvents(@Request() req) {
    return this.eventClient
      .send({ cmd: 'events.get_all_events' }, req.user)
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '리워드 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '리워드 요청 목록 조회 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.AUDITOR)
  @Get('events/reward-requests')
  async getRewardRequests(
    @Query('eventId') eventId: string,
    @Query('status') status: 'duplicate' | 'success' | 'failed',
  ) {
    return this.eventClient
      .send(
        { cmd: 'events.get_reward_requests' },
        { filter: { eventId, status } },
      )
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 이벤트 조회' })
  @ApiResponse({ status: 200, description: '이벤트 조회 성공' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard)
  @Get('events/:eventId')
  async getEvent(@Param('eventId') eventId: string) {
    return this.eventClient.send({ cmd: 'events.get_event' }, { eventId }).pipe(
      catchError((error) => {
        throw new HttpException(error.message, error?.error?.status ?? 500);
      }),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '이벤트 생성' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'startTime', 'endTime', 'goal'],
      properties: {
        title: { type: 'string' },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' },
        goal: {
          type: 'object',
          required: ['type', 'count'],
          properties: {
            type: { type: 'string', enum: ['invite', 'attendance'] },
            count: { type: 'number' },
            description: { type: 'string' },
          },
        },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  })
  @ApiResponse({ status: 201, description: '이벤트 생성 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR)
  @Post('events')
  async createEvent(
    @Body()
    data: {
      title: string;
      startTime: Date;
      endTime: Date;
      goal: {
        type: 'invite' | 'attendance';
        count: number;
        description?: string;
      };
      status?: 'active' | 'inactive';
    },
  ) {
    return this.eventClient.send({ cmd: 'events.create_event' }, data).pipe(
      catchError((error) => {
        throw new HttpException(error.message, error?.error?.status ?? 500);
      }),
    );
  }

  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        startTime: { type: 'string', format: 'date-time', nullable: true },
        endTime: { type: 'string', format: 'date-time', nullable: true },
        goal: {
          type: 'object',
          required: ['type', 'count'],
          properties: {
            type: { type: 'string', enum: ['invite', 'attendance'] },
            count: { type: 'number' },
            description: { type: 'string' },
          },
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive'],
        },
      },
    },
  })
  @ApiOperation({ summary: '이벤트 수정' })
  @ApiResponse({ status: 200, description: '이벤트 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR)
  @Put('events/:eventId')
  async updateEvent(
    @Param('eventId') eventId: string,
    @Body()
    data: {
      title?: string;
      startTime?: Date;
      endTime?: Date;
      goal?: {
        type: 'invite' | 'attendance';
        count: number;
        description?: string;
      };
      status?: 'active' | 'inactive';
    },
  ) {
    return this.eventClient
      .send({ cmd: 'events.update_event' }, { eventId, ...data })
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '리워드 생성' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'quantity'],
      properties: {
        type: { type: 'string', enum: ['point', 'drawCount'] },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '리워드 생성 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR)
  @Post('events/:eventId/rewards')
  async createReward(
    @Param('eventId') eventId: string,
    @Body()
    data: {
      type: 'point' | 'drawCount';
      quantity: number;
    },
  ) {
    return this.eventClient
      .send({ cmd: 'events.create_reward' }, { eventId, ...data })
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '리워드 수정' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['point', 'drawCount'] },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '리워드 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '리워드를 찾을 수 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR)
  @Put('events/:eventId/rewards/:rewardId')
  async updateReward(
    @Param('eventId') eventId: string,
    @Param('rewardId') rewardId: string,
    @Body() data: { type?: 'point' | 'drawCount'; quantity?: number },
  ) {
    return this.eventClient
      .send(
        { cmd: 'events.update_reward' },
        { rewardId, updateRewardDto: data },
      )
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '리워드 삭제' })
  @ApiResponse({ status: 200, description: '리워드 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '리워드를 찾을 수 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR)
  @Delete('events/:eventId/rewards/:rewardId')
  async deleteReward(
    @Param('eventId') eventId: string,
    @Param('rewardId') rewardId: string,
  ) {
    return this.eventClient
      .send({ cmd: 'events.delete_reward' }, { eventId, rewardId })
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자의 리워드 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '리워드 요청 목록 조회 성공' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get('events/user/reward-requests')
  async getUserRewardRequests(@Request() req) {
    return this.eventClient
      .send({ cmd: 'events.get_user_reward_requests' }, req.user)
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '리워드 요청' })
  @ApiResponse({ status: 200, description: '리워드 요청 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Post('events/:eventId/request-reward')
  async requestReward(@Param('eventId') eventId: string, @Request() req) {
    return this.eventClient
      .send({ cmd: 'events.request_reward' }, { eventId, ...req.user })
      .pipe(
        catchError((error) => {
          throw new HttpException(error.message, error?.error?.status ?? 500);
        }),
      );
  }
}
