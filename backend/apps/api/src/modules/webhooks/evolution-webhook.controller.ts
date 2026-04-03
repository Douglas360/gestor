import { Body, Controller, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { BossService } from '../boss/boss.service.js';
import { SupabaseService } from '../db/supabase.service.js';
import crypto from 'node:crypto';

@Controller('webhooks/whatsapp')
export class EvolutionWebhookController {
  constructor(
    private readonly boss: BossService,
    private readonly supabase: SupabaseService
  ) {}

  private async handleEvolutionWebhook(
    webhookSecret: string | undefined,
    tenantHeader: string | undefined,
    body: any,
    eventName?: string
  ) {
    // Instance name should come from Evolution payload.
    const instanceName = body?.instance || body?.instanceName || body?.data?.instance || null;

    // Resolve tenant by instance (authoritative for multi-tenant)
    let tenantId: string | null = tenantHeader || body?.tenantId || null;
    if (instanceName) {
      const { data: inst } = await this.supabase.client
        .from('wa_instances')
        .select('tenant_id, webhook_secret')
        .eq('instance_name', instanceName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inst?.webhook_secret && webhookSecret && inst.webhook_secret !== webhookSecret) {
        return { ok: false, error: 'invalid webhook secret' };
      }

      if (inst?.tenant_id) tenantId = inst.tenant_id as any;
    }

    // Derive a best-effort idempotency key from payload (provider might retry delivery)
    const providerEventId =
      body?.data?.key?.id ||
      body?.data?.messageId ||
      body?.messageId ||
      body?.id ||
      null;

    const idempotencyKey = providerEventId
      ? `evolution:${providerEventId}`
      : `evolution:sha256:${crypto
          .createHash('sha256')
          .update(JSON.stringify(body))
          .digest('hex')}`;

    // Optional global secret (kept for emergency), but prefer per-instance secret checked above.
    if (process.env.EVOLUTION_WEBHOOK_SECRET && webhookSecret !== process.env.EVOLUTION_WEBHOOK_SECRET) {
      return { ok: false, error: 'invalid webhook secret' };
    }

    // Persist raw webhook (optional but useful for audit/debug)
    await this.supabase.client.from('wa_webhook_events').insert({
      tenant_id: tenantId,
      instance_name: instanceName,
      idempotency_key: eventName ? `${idempotencyKey}:${eventName}` : idempotencyKey,
      payload: { ...body, _event: eventName }
    });

    // Enqueue processing job
    await this.boss.client.send('wa.inbound.process', {
      tenantId,
      instanceName,
      idempotencyKey: eventName ? `${idempotencyKey}:${eventName}` : idempotencyKey
    });

    return { ok: true };
  }

  @Post('evolution')
  @HttpCode(200)
  async evolution(
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: any
  ) {
    return this.handleEvolutionWebhook(webhookSecret, tenantHeader, body);
  }

  // Evolution can be configured with webhookByEvents=true, which appends /<event> to the URL.
  @Post('evolution/:event')
  @HttpCode(200)
  async evolutionByEvent(
    @Param('event') event: string,
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: any
  ) {
    return this.handleEvolutionWebhook(webhookSecret, tenantHeader, body, event);
  }

}
