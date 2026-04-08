import { Body, Controller, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { BossService } from '../boss/boss.service.js';
import { SupabaseService } from '../db/supabase.service.js';
import crypto from 'node:crypto';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null ? (value as JsonRecord) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

@Controller('webhooks/whatsapp')
export class EvolutionWebhookController {
  constructor(
    private readonly boss: BossService,
    private readonly supabase: SupabaseService
  ) {}

  private async handleEvolutionWebhook(
    webhookSecret: string | undefined,
    tenantHeader: string | undefined,
    body: unknown,
    eventName?: string
  ) {
    const payload = asRecord(body);
    const payloadData = asRecord(payload?.data);
    const payloadKey = asRecord(payloadData?.key);

    const instanceName =
      asString(payload?.instance) ||
      asString(payload?.instanceName) ||
      asString(payloadData?.instance) ||
      null;

    let tenantId: string | null = tenantHeader || asString(payload?.tenantId) || null;
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

      if (inst?.tenant_id) tenantId = String(inst.tenant_id);
    }

    const providerEventId =
      asString(payloadKey?.id) ||
      asString(payloadData?.messageId) ||
      asString(payload?.messageId) ||
      asString(payload?.id) ||
      null;

    const idempotencyKey = providerEventId
      ? `evolution:${providerEventId}`
      : `evolution:sha256:${crypto
          .createHash('sha256')
          .update(JSON.stringify(body))
          .digest('hex')}`;

    const eventIdempotencyKey = eventName ? `${idempotencyKey}:${eventName}` : idempotencyKey;

    if (process.env.EVOLUTION_WEBHOOK_SECRET && webhookSecret !== process.env.EVOLUTION_WEBHOOK_SECRET) {
      return { ok: false, error: 'invalid webhook secret' };
    }

    const { error: insertError } = await this.supabase.client.from('wa_webhook_events').insert({
      tenant_id: tenantId,
      instance_name: instanceName,
      idempotency_key: eventIdempotencyKey,
      payload: payload ? { ...payload, _event: eventName } : { raw: body, _event: eventName }
    });

    if (insertError && insertError.code !== '23505') {
      throw new Error(insertError.message);
    }

    await this.boss.client.send('wa.inbound.process', {
      tenantId,
      instanceName,
      idempotencyKey: eventIdempotencyKey
    });

    return { ok: true, duplicate: insertError?.code === '23505' };
  }

  @Post('evolution')
  @HttpCode(200)
  async evolution(
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: unknown
  ) {
    return this.handleEvolutionWebhook(webhookSecret, tenantHeader, body);
  }

  @Post('evolution/:event')
  @HttpCode(200)
  async evolutionByEvent(
    @Param('event') event: string,
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: unknown
  ) {
    return this.handleEvolutionWebhook(webhookSecret, tenantHeader, body, event);
  }
}
