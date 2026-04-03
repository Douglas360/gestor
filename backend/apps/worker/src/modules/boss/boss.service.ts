import { PgBoss } from 'pg-boss';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class BossService implements OnModuleInit, OnModuleDestroy {
  private boss!: PgBoss;

  get client() {
    return this.boss;
  }

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required');

    this.boss = new PgBoss({
      connectionString,
      schema: process.env.PG_BOSS_SCHEMA || 'pgboss'
    });

    await this.boss.start();

    // Ensure queues exist (pg-boss v10+ requires explicit queue creation)
    const queues = ['wa.inbound.process', 'wa.outbound.send', 'brain.decide_and_act', 'wa.media.download', 'wa.audio.transcribe', 'sla.tick', 'realtime.publish'];
    for (const name of queues) {
      try {
        await this.boss.createQueue(name);
      } catch {
        // ignore if already exists
      }
    }
  }

  async onModuleDestroy() {
    if (this.boss) await this.boss.stop({ graceful: true });
  }
}
