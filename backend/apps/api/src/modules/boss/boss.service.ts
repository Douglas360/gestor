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
      // keep schema default "pgboss" unless you want to isolate per app
      schema: process.env.PG_BOSS_SCHEMA || 'pgboss'
    });

    await this.boss.start();

    // Ensure queues exist (required for schedules; schedule table has FK to queue)
    const queues = [
      'wa.inbound.process',
      'wa.outbound.send',
      'brain.decide_and_act',
      'alerts.check_and_notify'
    ];

    for (const q of queues) {
      try {
        await this.boss.createQueue(q);
      } catch {
        // ignore
      }
    }
  }

  async onModuleDestroy() {
    if (this.boss) await this.boss.stop({ graceful: true });
  }
}
