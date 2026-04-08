export type Ulid = string;

export type TenantId = Ulid;
export type TaskId = Ulid;
export type OperatorId = Ulid;
export type WaInstanceId = Ulid;

export const TASK_STATUS_VALUES = [
  'created',
  'awaiting_operator',
  'in_progress',
  'awaiting_evidence',
  'completed',
  'blocked',
  'canceled'
] as const;

export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];

export const ALERT_DATE_MODE_VALUES = ['overdue', 'due_today'] as const;
export type AlertDateMode = (typeof ALERT_DATE_MODE_VALUES)[number];

export const DEFAULT_ALERT_STATUSES = ['created', 'in_progress', 'awaiting_evidence'] as const satisfies readonly TaskStatus[];

export type WaDirection = 'in' | 'out';

export const WA_MESSAGE_TYPE_VALUES = [
  'text',
  'interactive',
  'button',
  'image',
  'audio',
  'location',
  'admin_alert',
  'admin_alert_check',
  'unknown'
] as const;

export type WaMessageType = (typeof WA_MESSAGE_TYPE_VALUES)[number];

export const BOSS_JOB_NAME_VALUES = [
  'wa.inbound.process',
  'brain.decide_and_act',
  'wa.outbound.send',
  'alerts.check_and_notify',
  'wa.media.download',
  'wa.audio.transcribe',
  'sla.tick',
  'realtime.publish'
] as const;

export type BossJobName = (typeof BOSS_JOB_NAME_VALUES)[number];
