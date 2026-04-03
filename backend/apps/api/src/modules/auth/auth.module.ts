import { Global, Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AuthController } from './auth.controller.js';
import { TenantAuthGuard } from './tenant-auth.guard.js';

@Global()
@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [TenantAuthGuard],
  exports: [TenantAuthGuard]
})
export class AuthModule {}
