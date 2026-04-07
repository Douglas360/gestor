import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SupabaseService } from '../db/supabase.service.js';
import { AnyRequest, TenantAuthGuard } from '../auth/tenant-auth.guard.js';
import { EvolutionService } from './evolution.service.js';
import crypto from 'node:crypto';

@UseGuards(TenantAuthGuard)
@Controller('v1/tenants/:tenantId/whatsapp/instances')
export class WhatsAppInstancesController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly evolution: EvolutionService
  ) {}

  @Get()
  async list(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;

    const lim = limit ? Number(limit) : 20;
    const off = offset ? Number(offset) : 0;

    const { data, error } = await sb
      .from('wa_instances')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(off, off + lim - 1);

    if (error) throw new Error(error.message);
    return { data, limit: lim, offset: off };
  }

  @Post()
  async create(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Body() body: any) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;
    const instanceName = body?.instanceName || `t_${tenantId}_${crypto.randomBytes(6).toString('hex')}`;
    const token = crypto.randomBytes(18).toString('hex');
    const webhookSecret = crypto.randomBytes(18).toString('hex');

    const publicBaseUrl = process.env.PUBLIC_API_BASE_URL;
    if (!publicBaseUrl) throw new Error('PUBLIC_API_BASE_URL is required (e.g. https://gestorapi.seudominio.com)');

    const webhookUrl = `${publicBaseUrl}/webhooks/whatsapp/evolution`;

    const evo = await this.evolution.createInstance({
      instanceName,
      token,
      webhookUrl,
      webhookSecret,
      tenantId
    });

    const { data, error } = await sb
      .from('wa_instances')
      .insert({
        tenant_id: tenantId,
        instance_name: instanceName,
        instance_token: token,
        webhook_secret: webhookSecret,
        status: 'created',
        evolution_host: process.env.EVOLUTION_API_URL
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return { instance: data, evolution: evo };
  }

  @Get(':instanceId/qr')
  async qr(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Param('instanceId') instanceId: string
  ) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;

    const { data: inst, error } = await sb
      .from('wa_instances')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', instanceId)
      .single();
    if (error) throw new Error(error.message);

    const qr = await this.evolution.getQrCode(inst.instance_name);
    return { ok: true, instance_name: inst.instance_name, qr };
  }

  @Get(':instanceId/status')
  async status(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Param('instanceId') instanceId: string
  ) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;

    const { data: inst, error } = await sb
      .from('wa_instances')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', instanceId)
      .single();
    if (error) throw new Error(error.message);

    const status = await this.evolution.getStatus(inst.instance_name);

    // Best-effort: persist status string if present
    const nextStatus = status?.state || status?.status || status?.instance?.state || null;
    if (nextStatus) {
      await sb
        .from('wa_instances')
        .update({ status: String(nextStatus) })
        .eq('id', inst.id);
    }

    return { ok: true, instance_name: inst.instance_name, evolution: status, saved_status: nextStatus };
  }

  @Delete(':instanceId')
  async remove(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Param('instanceId') instanceId: string
  ) {
    const sb = req.authToken ? this.supabase.clientForAccessToken(req.authToken) : this.supabase.client;

    const { data: inst, error } = await sb
      .from('wa_instances')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', instanceId)
      .single();
    if (error) throw new Error(error.message);

    // Best-effort delete in Evolution first
    let evolution: any = null;
    try {
      evolution = await this.evolution.deleteInstance(inst.instance_name);
    } catch (e: any) {
      evolution = { ok: false, error: e?.message || String(e) };
    }

    // Hard-delete in DB (requested). Note: late webhooks from this instance may no longer resolve tenant.
    const { error: delErr } = await sb
      .from('wa_instances')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', instanceId);
    if (delErr) throw new Error(delErr.message);

    return { ok: true, deleted_instance_id: instanceId, evolution };
  }
}
