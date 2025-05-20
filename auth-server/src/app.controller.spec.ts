import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthService } from './auth/auth.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AuthService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('signUp', () => {
    it('should return "Hello World!"', () => {
      expect(
        appController.signUp({ email: 'test@test.com', password: '1234' }),
      ).toBe('Hello World!');
    });
  });
});
