import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.HOST ?? 'localhost',
        port: parseInt(process.env.PORT ?? '3001', 10),
      },
    },
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen();
}
bootstrap();
