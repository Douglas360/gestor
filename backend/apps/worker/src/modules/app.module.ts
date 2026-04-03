import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BossModule } from './boss/boss.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { DbModule } from './db/db.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule, BossModule, JobsModule]
})
export class AppModule {}
