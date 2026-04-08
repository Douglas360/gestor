import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { BossService } from '../boss/boss.service.js';
import { SupabaseService } from '../db/supabase.service.js';
import { AnyRequest, TenantAuthGuard } from '../auth/tenant-auth.guard.js';

@UseGuards(TenantAuthGuard)
@Controller('v1/tenants/:tenantId/tasks')
export class TasksController {
  constructor(
    private readonly boss: BossService,
    private readonly supabase: SupabaseService
  ) {}

  @Post(':taskId/notify')
  async notify(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Param('taskId') taskId: string,
    @Body() body: any
  ) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);
    // optional override
    const operatorId = body?.operatorId ?? null;

    // Validate task exists for tenant
    const { data: task, error } = await sb
      .from('tasks')
      .select('id, tenant_id, operator_id')
      .eq('tenant_id', tenantId)
      .eq('id', taskId)
      .single();

    if (error) throw new Error(error.message);

    await this.boss.client.send('wa.outbound.send', {
      tenantId,
      taskId: task.id,
      operatorId: operatorId || task.operator_id
    });

    return { ok: true };
  }
}
