import type { Priority, Subtarefa } from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gestorapi.magicti.com';

export type ApiRecord = Record<string, unknown>;
export type ApiTaskStatus =
  | 'created'
  | 'awaiting_operator'
  | 'in_progress'
  | 'awaiting_evidence'
  | 'completed'
  | 'blocked'
  | 'canceled';
export type ApiTaskPriority = Priority;
export type ApiAlertDateMode = 'overdue' | 'due_today';
export type ApiTaskSubtask = Subtarefa;
export type ApiTaskEventData = ApiRecord;

export type ApiEvolutionPayload = ApiRecord & {
  state?: string | null;
  status?: string | null;
  connection?: string | null;
  instance?: ApiRecord | null;
};

export type ApiQrPayload = ApiRecord & {
  base64?: string | null;
  qrcode?: string | ApiRecord | null;
  qr?: string | ApiRecord | null;
  data?: ApiRecord | null;
};

function getTenantId(): string {
  const env = process.env.NEXT_PUBLIC_TENANT_ID || '';
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('gestor.tenantId') || '';
    const hasToken = Boolean(window.localStorage.getItem('gestor.authToken'));
    if (hasToken && stored) return stored;
  }
  if (env) return env;
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('gestor.tenantId') || '';
}

export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || '';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('gestor.authToken');
}

function requireTenantId(): string {
  const tenantId = getTenantId();
  if (!tenantId) throw new Error('Tenant não definido. Faça login novamente.');
  return tenantId;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token = getAuthToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  return (await res.json()) as T;
}

export type ApiOperator = {
  id: string;
  tenant_id: string;
  name: string;
  wa_phone: string;
  active: boolean;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type CreateOperatorInput = {
  name: string;
  wa_phone: string;
  active?: boolean;
  email?: string | null;
  role?: string | null;
  avatar_url?: string | null;
};

export type UpdateOperatorInput = Partial<CreateOperatorInput>;

export async function listOperators() {
  const tenantId = getTenantId();
  if (!tenantId) throw new Error('Tenant not set. Faça login novamente.');
  return apiFetch<{ data: ApiOperator[] }>(`/v1/tenants/${tenantId}/operators`);
}

export async function createOperator(input: CreateOperatorInput) {
  const tenantId = requireTenantId();
  return apiFetch<ApiOperator>(`/v1/tenants/${tenantId}/operators`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateOperator(id: string, patch: UpdateOperatorInput) {
  const tenantId = requireTenantId();
  return apiFetch<ApiOperator>(`/v1/tenants/${tenantId}/operators/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export async function deleteOperator(id: string) {
  const tenantId = requireTenantId();
  return apiFetch<{ ok: true }>(`/v1/tenants/${tenantId}/operators/${id}`, { method: 'DELETE' });
}

export type ApiTaskEvent = {
  id: string;
  tenant_id: string;
  task_id: string;
  kind: string;
  data: ApiTaskEventData;
  created_at: string;
  actor_operator_id: string | null;
};

export type ApiTask = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: ApiTaskStatus;
  operator_id: string | null;
  priority: ApiTaskPriority;
  due_date: string | null;
  tags: string[];
  subtasks: ApiTaskSubtask[];
  reminder: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  status?: ApiTaskStatus;
  operator_id?: string | null;
  priority?: ApiTaskPriority;
  due_date?: string | null;
  tags?: string[];
  subtasks?: ApiTaskSubtask[];
  reminder?: string | null;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export async function listTasks() {
  const tenantId = requireTenantId();
  return apiFetch<{ data: ApiTask[] }>(`/v1/tenants/${tenantId}/tasks`);
}

export async function createTask(input: CreateTaskInput) {
  const tenantId = requireTenantId();
  return apiFetch<ApiTask>(`/v1/tenants/${tenantId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateTask(id: string, patch: UpdateTaskInput) {
  const tenantId = requireTenantId();
  return apiFetch<ApiTask>(`/v1/tenants/${tenantId}/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export async function deleteTask(id: string) {
  const tenantId = requireTenantId();
  return apiFetch<{ ok: true }>(`/v1/tenants/${tenantId}/tasks/${id}`, { method: 'DELETE' });
}

export async function notifyTask(id: string) {
  const tenantId = requireTenantId();
  return apiFetch<{ ok: true }>(`/v1/tenants/${tenantId}/tasks/${id}/notify`, { method: 'POST', body: '{}' });
}

export async function listTaskEvents(taskId: string) {
  const tenantId = requireTenantId();
  return apiFetch<{ data: ApiTaskEvent[] }>(`/v1/tenants/${tenantId}/tasks/${taskId}/events`);
}

export type ApiTenantSettings = {
  id: string;
  name: string;
  admin_wa_phone: string | null;
};

export async function getTenantSettings() {
  const tenantId = requireTenantId();
  return apiFetch<ApiTenantSettings>(`/v1/tenants/${tenantId}/settings`);
}

export async function updateTenantSettings(patch: Partial<{ admin_wa_phone: string | null }>) {
  const tenantId = requireTenantId();
  return apiFetch<ApiTenantSettings>(`/v1/tenants/${tenantId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export type ApiTenantAlert = {
  id: string;
  tenant_id: string;
  name: string;
  date_mode: ApiAlertDateMode;
  statuses: ApiTaskStatus[];
  cron: string;
  timezone: string;
  enabled: boolean;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAlertInput = {
  name: string;
  date_mode: ApiAlertDateMode;
  statuses: ApiTaskStatus[];
  cron: string;
  timezone?: string;
  enabled?: boolean;
};

export type UpdateAlertInput = Partial<CreateAlertInput>;

export async function listAlerts() {
  const tenantId = requireTenantId();
  return apiFetch<{ data: ApiTenantAlert[] }>(`/v1/tenants/${tenantId}/alerts`);
}

export async function createAlert(input: CreateAlertInput) {
  const tenantId = requireTenantId();
  return apiFetch<ApiTenantAlert>(`/v1/tenants/${tenantId}/alerts`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateAlert(alertId: string, patch: UpdateAlertInput) {
  const tenantId = requireTenantId();
  return apiFetch<ApiTenantAlert>(`/v1/tenants/${tenantId}/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export async function deleteAlert(alertId: string) {
  const tenantId = requireTenantId();
  return apiFetch<{ ok: true }>(`/v1/tenants/${tenantId}/alerts/${alertId}`, { method: 'DELETE' });
}

export type ApiWaInstance = {
  id: string;
  tenant_id: string;
  instance_name: string;
  instance_token: string;
  webhook_secret: string;
  evolution_host: string | null;
  status: string;
  created_at: string;
};

export type ApiWaInstanceCreateResponse = {
  instance: ApiWaInstance;
  evolution: ApiRecord | null;
};

export type ApiWaQrResponse = {
  ok: true;
  instance_name: string;
  qr: ApiQrPayload | null;
};

export type ApiWaStatusResponse = {
  ok: true;
  instance_name: string;
  evolution: ApiEvolutionPayload | null;
  saved_status: string | null;
};

export type ApiWaDeleteResponse = {
  ok: true;
  deleted_instance_id: string;
  evolution: ApiRecord | null;
};

export async function listWaInstances() {
  const tenantId = requireTenantId();
  return apiFetch<{ data: ApiWaInstance[] }>(`/v1/tenants/${tenantId}/whatsapp/instances`);
}

export async function createWaInstance(input?: { instanceName?: string }) {
  const tenantId = requireTenantId();
  return apiFetch<ApiWaInstanceCreateResponse>(`/v1/tenants/${tenantId}/whatsapp/instances`, {
    method: 'POST',
    body: JSON.stringify(input || {})
  });
}

export async function getWaQr(instanceId: string) {
  const tenantId = requireTenantId();
  return apiFetch<ApiWaQrResponse>(`/v1/tenants/${tenantId}/whatsapp/instances/${instanceId}/qr`);
}

export async function getWaStatus(instanceId: string) {
  const tenantId = requireTenantId();
  return apiFetch<ApiWaStatusResponse>(`/v1/tenants/${tenantId}/whatsapp/instances/${instanceId}/status`);
}

export async function deleteWaInstance(instanceId: string) {
  const tenantId = requireTenantId();
  return apiFetch<ApiWaDeleteResponse>(`/v1/tenants/${tenantId}/whatsapp/instances/${instanceId}`, {
    method: 'DELETE'
  });
}
