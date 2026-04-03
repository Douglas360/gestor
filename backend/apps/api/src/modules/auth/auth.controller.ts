import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseService } from '../db/supabase.service.js';
import { TenantAuthGuard } from './tenant-auth.guard.js';
import type { AnyRequest } from './tenant-auth.guard.js';

@UseGuards(TenantAuthGuard)
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Bootstrap tenant + profile for a Gestor.
   * Tenant is the Gestor workspace (tenant_id == user_id).
   */
  @Post('bootstrap-gestor')
  async bootstrapGestor(@Req() req: AnyRequest, @Body() body: { name?: string }) {
    if (!req.user?.id) throw new Error('Missing req.user (AUTH_ENABLED must be true)');

    const userId = String(req.user.id);
    const name = body?.name || req.user.email || 'Gestor';

    // If profile exists, return it
    const { data: existing } = await this.supabase.client
      .from('profiles')
      .select('tenant_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.tenant_id) {
      return { ok: true, tenantId: existing.tenant_id, role: existing.role };
    }

    // Ensure tenant row exists with id=userId
    const { error: tErr } = await this.supabase.client.from('tenants').upsert({
      id: userId,
      name
    });
    if (tErr) throw new Error(tErr.message);

    const { error: pErr } = await this.supabase.client.from('profiles').insert({
      user_id: userId,
      tenant_id: userId,
      role: 'gestor',
      gestor_user_id: null
    });
    if (pErr) throw new Error(pErr.message);

    return { ok: true, tenantId: userId, role: 'gestor' };
  }
}
