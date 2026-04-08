import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { SupabaseService } from '../db/supabase.service.js';
import { AnyRequest, TenantAuthGuard } from '../auth/tenant-auth.guard.js';

@UseGuards(TenantAuthGuard)
@Controller('v1/tenants/:tenantId/settings')
export class TenantsSettingsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async get(@Req() req: AnyRequest, @Param('tenantId') tenantId: string) {
    // Use service role client to bypass RLS (guard already enforces tenant access)
    const sb = this.supabase.client;
    const { data, error } = await sb
      .from('tenants')
      .select('id, name, admin_wa_phone')
      .eq('id', tenantId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    // If RLS blocks or row not visible, avoid 500 and return a minimal object
    if (!data) {
      return { id: tenantId, name: null, admin_wa_phone: null } as any;
    }

    return data;
  }

  @Patch()
  async update(@Req() req: AnyRequest, @Param('tenantId') tenantId: string, @Body() body: any) {
    const sb = this.supabase.client;

    const patch: any = {};
    if (body?.admin_wa_phone !== undefined) {
      const raw = String(body.admin_wa_phone || '').trim();
      patch.admin_wa_phone = raw || null;
    }

    const { data, error } = await sb
      .from('tenants')
      .update(patch)
      .eq('id', tenantId)
      .select('id, name, admin_wa_phone')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
