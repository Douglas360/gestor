import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { TenantsSettingsController } from './tenants-settings.controller.js';

@Module({
  imports: [DbModule],
  controllers: [TenantsSettingsController]
})
export class TenantsModule {}
