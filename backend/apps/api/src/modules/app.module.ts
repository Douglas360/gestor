import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { BossModule } from './boss/boss.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { WhatsAppModule } from './whatsapp/whatsapp.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { OperatorsModule } from './operators/operators.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { AlertsModule } from './alerts/alerts.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BossModule,
    HealthModule,
    WhatsAppModule,
    WebhooksModule,
    TasksModule,
    OperatorsModule,
    TenantsModule,
    AlertsModule
  ]
})
export class AppModule {}
