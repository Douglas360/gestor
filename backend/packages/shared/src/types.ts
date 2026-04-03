export type Ulid = string;

export type TenantId = Ulid;
export type TaskId = Ulid;
export type OperatorId = Ulid;
export type WaInstanceId = Ulid;

export type TaskStatus =
  | 'created'
  | 'awaiting_operator'
  | 'in_progress'
  | 'awaiting_evidence'
  | 'completed'
  | 'blocked'
  | 'canceled';

export type WaDirection = 'in' | 'out';
export type WaMessageType =
  | 'text'
  | 'interactive'
  | 'button'
  | 'image'
  | 'audio'
  | 'location'
  | 'unknown';

export type BossJobName =
  | 'wa.inbound.process'
  | 'brain.decide_and_act'
  | 'wa.outbound.send'
  | 'wa.media.download'
  | 'wa.audio.transcribe'
  | 'sla.tick'
  | 'realtime.publish';
