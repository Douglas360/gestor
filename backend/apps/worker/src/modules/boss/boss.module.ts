import { Module } from '@nestjs/common';
import { BossService } from './boss.service.js';

@Module({
  providers: [BossService],
  exports: [BossService]
})
export class BossModule {}
