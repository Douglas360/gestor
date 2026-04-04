import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseService } from '../db/supabase.service.js';
import { AnyRequest, TenantAuthGuard } from '../auth/tenant-auth.guard.js';
import { BossService } from '../boss/boss.service.js';

function scheduleKey(alertId: string) {
  return `tenant_alert:${alertId}`;
}

@UseGuards(TenantAuthGuard)
@Controller('v1/tenants/:tenantId/alerts')
export class AlertsController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly boss: BossService
  ) {}

  @Get()
  async list(@Req() req: AnyRequest, @Param('tenantId') tenantId: string) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;

    const { data, error } = await sb
      .from('tenant_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { data: data || [] };
  }

  @Post()
  async create(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Body() body: any) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;

    const payload = {
      tenant_id: tenantId,
      name: String(body?.name || 'Alerta'),
      date_mode: String(body?.date_mode || 'overdue'),
      statuses: Array.isArray(body?.statuses) ? body.statuses.map(String) : ['created', 'in_progress', 'awaiting_evidence'],
      cron: String(body?.cron || '0 9 * * *'),
      timezone: String(body?.timezone || 'America/Sao_Paulo'),
      enabled: body?.enabled ?? true
    };

    const { data, error } = await sb.from('tenant_alerts').insert(payload).select('*').single();
    if (error) throw new Error(error.message);

    // schedule/unschedule
    if (data.enabled) {
      await this.boss.client.schedule(
        'alerts.check_and_notify',
        data.cron,
        { tenantId, alertId: data.id },
        { tz: data.timezone, key: scheduleKey(data.id) }
      );
    }

    return data;
  }

  @Patch(':alertId')
  async update(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Param('alertId') alertId: string,
    @Body() body: any
  ) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;

    const patch: any = {};
    if (body?.name !== undefined) patch.name = String(body.name);
    if (body?.date_mode !== undefined) patch.date_mode = String(body.date_mode);
    if (body?.statuses !== undefined) patch.statuses = Array.isArray(body.statuses) ? body.statuses.map(String) : [];
    if (body?.cron !== undefined) patch.cron = String(body.cron);
    if (body?.timezone !== undefined) patch.timezone = String(body.timezone);
    if (body?.enabled !== undefined) patch.enabled = Boolean(body.enabled);

    const { data, error } = await sb
      .from('tenant_alerts')
      .update(patch)
      .eq('tenant_id', tenantId)
      .eq('id', alertId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Re-schedule
    await this.boss.client.unschedule('alerts.check_and_notify', scheduleKey(alertId));
    if (data.enabled) {
      await this.boss.client.schedule(
        'alerts.check_and_notify',
        data.cron,
        { tenantId, alertId: data.id },
        { tz: data.timezone, key: scheduleKey(data.id) }
      );
    }

    return data;
  }

  @Delete(':alertId')
  async remove(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Param('alertId') alertId: string) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;

    await this.boss.client.unschedule('alerts.check_and_notify', scheduleKey(alertId));

    const { error } = await sb.from('tenant_alerts').delete().eq('tenant_id', tenantId).eq('id', alertId);
    if (error) throw new Error(error.message);

    return { ok: true };
  }
}
