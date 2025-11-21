import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log('Server running on http://localhost:3000');
}

bootstrap();
