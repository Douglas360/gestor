import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  type CreateTenantAlertInput,
  type UpdateTenantAlertInput,
  zCreateTenantAlert,
  zUpdateTenantAlert
} from '@gestor/shared';
import { SupabaseService } from '../db/supabase.service.js';
import { AnyRequest, TenantAuthGuard } from '../auth/tenant-auth.guard.js';
import { BossService } from '../boss/boss.service.js';

function scheduleKey(alertId: string) {
  // pg-boss key allows: alphanumeric, underscore, hyphen, period, forward slash
  return `tenant_alert/${alertId}`;
}

function parseCreateAlert(body: unknown): CreateTenantAlertInput {
  const parsed = zCreateTenantAlert.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join('; '));
  }

  return parsed.data;
}

function parseUpdateAlert(body: unknown): UpdateTenantAlertInput {
  const parsed = zUpdateTenantAlert.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join('; '));
  }

  return parsed.data;
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
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    const { data, error } = await sb
      .from('tenant_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { data: data || [] };
  }

  @Post()
  async create(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Body() body: unknown) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);
    const parsed = parseCreateAlert(body);

    const payload = {
      tenant_id: tenantId,
      name: parsed.name,
      date_mode: parsed.date_mode,
      statuses: parsed.statuses,
      cron: parsed.cron,
      timezone: parsed.timezone,
      enabled: parsed.enabled
    };

    const { data, error } = await sb.from('tenant_alerts').insert(payload).select('*').single();
    if (error) throw new Error(error.message);

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
    @Body() body: unknown
  ) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);
    const patch = parseUpdateAlert(body);

    if (Object.keys(patch).length === 0) {
      const { data, error } = await sb
        .from('tenant_alerts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', alertId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const { data, error } = await sb
      .from('tenant_alerts')
      .update(patch)
      .eq('tenant_id', tenantId)
      .eq('id', alertId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

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
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    await this.boss.client.unschedule('alerts.check_and_notify', scheduleKey(alertId));

    const { error } = await sb.from('tenant_alerts').delete().eq('tenant_id', tenantId).eq('id', alertId);
    if (error) throw new Error(error.message);

    return { ok: true };
  }
}
