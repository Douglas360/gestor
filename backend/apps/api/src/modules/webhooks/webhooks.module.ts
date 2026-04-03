import { Module } from '@nestjs/common';
import { BossModule } from '../boss/boss.module.js';
import { DbModule } from '../db/db.module.js';
import { EvolutionWebhookController } from './evolution-webhook.controller.js';

@Module({
  imports: [BossModule, DbModule],
  controllers: [EvolutionWebhookController]
})
export class WebhooksModule {}
