import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipeConfig } from './config/validation.pipe.config';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.use(cookieParser());
  app.useGlobalPipes(validationPipeConfig);

  app.useWebSocketAdapter(new IoAdapter(app));
  logger.log('✅ WebSocket IoAdapter initialized');

  const port = process.env.PORT ?? 8001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
