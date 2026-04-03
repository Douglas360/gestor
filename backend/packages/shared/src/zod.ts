import { z } from 'zod';

export const zUlid = z.string().min(8);

export const zWebhookHeaders = z.object({
  'x-webhook-secret': z.string().min(8).optional(),
  'x-tenant-id': z.string().min(1).optional()
});
