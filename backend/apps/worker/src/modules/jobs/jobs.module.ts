import { Module } from '@nestjs/common';
import { BossModule } from '../boss/boss.module.js';
import { DbModule } from '../db/db.module.js';
import { EvolutionService } from '../whatsapp/evolution.service.js';
import { JobsRunner } from './jobs.runner.js';

@Module({
  imports: [BossModule, DbModule],
  providers: [EvolutionService, JobsRunner]
})
export class JobsModule {}
