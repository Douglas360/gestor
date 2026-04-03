import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { SupabaseService } from '../db/supabase.service.js';

export type AnyRequest = {
  headers: Record<string, string | string[] | undefined>;
  params?: any;
  user?: any;
  authToken?: string;
};

export function getBearerToken(req: AnyRequest): string | null {
  const h = req.headers['authorization'];
  if (!h) return null;
  const v = Array.isArray(h) ? h[0] : h;
  const m = /^Bearer\s+(.+)$/i.exec(v);
  return m?.[1] ?? null;
}

@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const enabled = String(process.env.AUTH_ENABLED || '').toLowerCase() === 'true';
    if (!enabled) return true;

    const req = ctx.switchToHttp().getRequest<AnyRequest>();

    const token = getBearerToken(req);
    if (!token) throw new UnauthorizedException('Missing Authorization: Bearer <token>');

    // Make token available to controllers so they can create a user-scoped Supabase client (RLS).
    req.authToken = token;

    const user = await this.supabase.getUserFromAccessToken(token);
    if (!user) throw new UnauthorizedException('Invalid token');

    // Attach for controllers/logging if needed
    req.user = { id: user.id, email: user.email };

    const tenantId = (req.params as any)?.tenantId;
    if (!tenantId) return true;

    const strict = String(process.env.AUTH_STRICT || '').toLowerCase() === 'true';

    // Membership model (MVP): public.profiles defines which tenant the user belongs to.
    // - role=gestor => tenant_id is their workspace
    // - role=operador => tenant_id is gestor workspace; gestor_user_id points to owner
    const { data: prof, error } = await this.supabase.client
      .from('profiles')
      .select('tenant_id, role, gestor_user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      if (!strict) return true;
      throw new ForbiddenException(`Profiles check failed: ${error.message}`);
    }

    if (!prof?.tenant_id) throw new ForbiddenException('User has no tenant profile');
    if (String(prof.tenant_id) !== String(tenantId)) throw new ForbiddenException('User is not a member of this tenant');

    // Attach role context
    req.user = { ...req.user, tenantId: prof.tenant_id, role: prof.role, gestorUserId: prof.gestor_user_id || null };

    return true;
  }
}
