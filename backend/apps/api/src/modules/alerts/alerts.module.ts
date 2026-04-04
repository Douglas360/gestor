import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { BossModule } from '../boss/boss.module.js';
import { AlertsController } from './alerts.controller.js';

@Module({
  imports: [DbModule, BossModule],
  controllers: [AlertsController]
})
export class AlertsModule {}
