import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // eslint-disable-next-line no-console
  console.log('[worker] started');
  // keep process alive
  await app.init();
}

bootstrap();
