import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth/auth.service';
import { UserRoleType } from './users/schemas/user.schema';
import { of } from 'rxjs';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'auth.signup' })
  async signUp(
    @Payload()
    data: {
      email: string;
      password: string;
      role?: UserRoleType;
      inviterEmail?: string;
    },
  ) {
    const result = await this.authService.signUp(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'auth.login' })
  async login(@Payload() data: { email: string; password: string }) {
    const result = await this.authService.login(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'auth.refresh-access-token' })
  async refreshAccessToken(
    @Payload() data: { accessToken: string; userId: string },
  ) {
    const result = await this.authService.refreshAccessToken(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'auth.logout' })
  async logout(@Payload() data: { userId: string }) {
    await this.authService.logout(data);
    return of({ success: true });
  }

  @MessagePattern({ cmd: 'auth.update-role' })
  async updateRole(@Payload() data: { userId: string; role: UserRoleType }) {
    await this.authService.updateRole(data);
    return of({ success: true });
  }

  @MessagePattern({ cmd: 'auth.get-user' })
  async getUser(@Payload() data: { userId: string }) {
    const result = await this.authService.getUser(data);
    return of(result);
  }

  @MessagePattern({ cmd: 'auth.update-user-point-draw-count' })
  async updateUserPointDrawCount(
    @Payload() data: { userId: string; point?: number; drawCount?: number },
  ) {
    await this.authService.updateUserPointDrawCount(data);
    return of({ success: true });
  }
}
