import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipeConfig } from './config/validation.pipe.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(validationPipeConfig);

  const port = process.env.PORT ?? 9000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
