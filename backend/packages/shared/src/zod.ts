import { z } from 'zod';
import { ALERT_DATE_MODE_VALUES, DEFAULT_ALERT_STATUSES, TASK_STATUS_VALUES } from './types.js';

export const zUlid = z.string().min(8);

export const zWebhookHeaders = z.object({
  'x-webhook-secret': z.string().min(8).optional(),
  'x-tenant-id': z.string().min(1).optional()
});

export const zTaskStatus = z.enum(TASK_STATUS_VALUES);
export const zAlertDateMode = z.enum(ALERT_DATE_MODE_VALUES);
export const zAlertStatuses = z.array(zTaskStatus).min(1).max(20);
export const zAlertCron = z
  .string()
  .trim()
  .regex(/^(\S+\s+){4}\S+$/, 'cron must contain exactly 5 fields');
export const zAlertTimezone = z.string().trim().min(1).max(100);

export const zCreateTenantAlert = z.object({
  name: z.string().trim().min(1).max(120).default('Alerta'),
  date_mode: zAlertDateMode.default('overdue'),
  statuses: zAlertStatuses.default([...DEFAULT_ALERT_STATUSES]),
  cron: zAlertCron.default('0 9 * * *'),
  timezone: zAlertTimezone.default('America/Sao_Paulo'),
  enabled: z.boolean().default(true)
});

export const zUpdateTenantAlert = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  date_mode: zAlertDateMode.optional(),
  statuses: zAlertStatuses.optional(),
  cron: zAlertCron.optional(),
  timezone: zAlertTimezone.optional(),
  enabled: z.boolean().optional()
});

export type CreateTenantAlertInput = z.infer<typeof zCreateTenantAlert>;
export type UpdateTenantAlertInput = z.infer<typeof zUpdateTenantAlert>;
