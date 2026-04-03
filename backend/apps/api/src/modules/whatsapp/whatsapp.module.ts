import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { EvolutionService } from './evolution.service.js';
import { WhatsAppInstancesController } from './whatsapp-instances.controller.js';

@Module({
  imports: [DbModule],
  providers: [EvolutionService],
  controllers: [WhatsAppInstancesController]
})
export class WhatsAppModule {}
