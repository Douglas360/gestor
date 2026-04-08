import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SupabaseService } from '../db/supabase.service.js';
import { AnyRequest, TenantAuthGuard } from '../auth/tenant-auth.guard.js';

@UseGuards(TenantAuthGuard)
@Controller('v1/tenants/:tenantId/operators')
export class OperatorsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  async create(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Body() body: any) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);
    const payload = {
      tenant_id: tenantId,
      name: String(body?.name || ''),
      wa_phone: String(body?.wa_phone || ''),
      active: body?.active ?? true,
      email: body?.email ?? null,
      role: body?.role ?? null,
      avatar_url: body?.avatar_url ?? null
    };

    if (!payload.name) throw new Error('name is required');
    if (!payload.wa_phone) throw new Error('wa_phone is required');

    const { data, error } = await sb
      .from('operators')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Operators do not have login in this product scope (WhatsApp-only).
    // Keep email field as optional metadata.
    return data;
  }

  @Get()
  async list(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Query('active') active?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    let q = sb.from('operators').select('*').eq('tenant_id', tenantId);
    if (active === 'true') q = q.eq('active', true);
    if (active === 'false') q = q.eq('active', false);

    const lim = limit ? Number(limit) : 50;
    const off = offset ? Number(offset) : 0;

    const { data, error } = await q.order('created_at', { ascending: false }).range(off, off + lim - 1);
    if (error) throw new Error(error.message);
    return { data, limit: lim, offset: off };
  }

  @Get(':operatorId')
  async get(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Param('operatorId') operatorId: string) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    const { data, error } = await sb
      .from('operators')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', operatorId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  @Patch(':operatorId')
  async update(
    @Req() req: AnyRequest,
    @Param('tenantId') tenantId: string,
    @Param('operatorId') operatorId: string,
    @Body() body: any
  ) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    const patch: any = {};
    if (body?.name !== undefined) patch.name = String(body.name);
    if (body?.wa_phone !== undefined) patch.wa_phone = String(body.wa_phone);
    if (body?.active !== undefined) patch.active = Boolean(body.active);
    if (body?.email !== undefined) patch.email = body.email;
    if (body?.role !== undefined) patch.role = body.role;
    if (body?.avatar_url !== undefined) patch.avatar_url = body.avatar_url;

    const { data, error } = await sb
      .from('operators')
      .update(patch)
      .eq('tenant_id', tenantId)
      .eq('id', operatorId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  @Delete(':operatorId')
  async remove(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Param('operatorId') operatorId: string) {
    const sb = this.supabase.clientForRequestAccessToken(req.authToken);

    const { error } = await sb
      .from('operators')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', operatorId);

    if (error) throw new Error(error.message);
    return { ok: true };
  }
}
