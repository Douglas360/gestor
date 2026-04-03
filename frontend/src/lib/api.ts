export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gestorapi.magicti.com';
function getTenantId(): string {
  const env = process.env.NEXT_PUBLIC_TENANT_ID || '';
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('gestor.tenantId') || '';
    const hasToken = Boolean(window.localStorage.getItem('gestor.authToken'));
    // If authenticated, prefer stored tenant (multi-user). Otherwise keep env (MVP default).
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
  const t = getTenantId();
  if (!t) throw new Error('Tenant não definido. Faça login novamente.');
  return t;
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

// Operators
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

export async function listOperators() {
  const tenantId = getTenantId();
  if (!tenantId) throw new Error('Tenant not set. Faça login novamente.');
  return apiFetch<{ data: ApiOperator[] }>(`/v1/tenants/${tenantId}/operators`);
}

export async function createOperator(input: { name: string; wa_phone: string; active?: boolean; email?: string | null; role?: string | null; avatar_url?: string | null }) {
  const tenantId = requireTenantId();
  return apiFetch<ApiOperator>(`/v1/tenants/${tenantId}/operators`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateOperator(
  id: string,
  patch: Partial<{ name: string; wa_phone: string; active: boolean; email: string | null; role: string | null; avatar_url: string | null }>
) {
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

// Tasks
export type ApiTaskEvent = {
  id: string;
  tenant_id: string;
  task_id: string;
  kind: string;
  data: any;
  created_at: string;
  actor_operator_id: string | null;
};

export type ApiTask = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: string;
  operator_id: string | null;
  priority: string;
  due_date: string | null;
  tags: string[];
  subtasks: any[];
  reminder: string | null;
  created_at: string;
  updated_at: string;
};

export async function listTasks() {
  const tenantId = requireTenantId();
  return apiFetch<{ data: ApiTask[] }>(`/v1/tenants/${tenantId}/tasks`);
}

export async function createTask(input: {
  title: string;
  description?: string | null;
  status?: string;
  operator_id?: string | null;
  priority?: string;
  due_date?: string | null;
  tags?: string[];
  subtasks?: any[];
  reminder?: string | null;
}) {
  const tenantId = requireTenantId();
  return apiFetch<ApiTask>(`/v1/tenants/${tenantId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: string;
    operator_id: string | null;
    priority: string;
    due_date: string | null;
    tags: string[];
    subtasks: any[];
    reminder: string | null;
  }>
) {
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

// Tenant Settings
export type ApiTenantSettings = { id: string; name: string; admin_wa_phone: string | null };

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

// WhatsApp Instances
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

export async function listWaInstances() {
  const tenantId = requireTenantId();
  return apiFetch<{ data: ApiWaInstance[] }>(`/v1/tenants/${tenantId}/whatsapp/instances`);
}

export async function createWaInstance(input?: { instanceName?: string }) {
  const tenantId = requireTenantId();
  return apiFetch<{ instance: ApiWaInstance; evolution: any }>(`/v1/tenants/${tenantId}/whatsapp/instances`, {
    method: 'POST',
    body: JSON.stringify(input || {})
  });
}

export async function getWaQr(instanceId: string) {
  const tenantId = requireTenantId();
  return apiFetch<{ ok: true; instance_name: string; qr: any }>(`/v1/tenants/${tenantId}/whatsapp/instances/${instanceId}/qr`);
}

export async function getWaStatus(instanceId: string) {
  const tenantId = requireTenantId();
  return apiFetch<{ ok: true; instance_name: string; evolution: any; saved_status: string | null }>(
    `/v1/tenants/${tenantId}/whatsapp/instances/${instanceId}/status`
  );
}

export async function deleteWaInstance(instanceId: string) {
  const tenantId = requireTenantId();
  return apiFetch<{ ok: true; deleted_instance_id: string; evolution: any }>(
    `/v1/tenants/${tenantId}/whatsapp/instances/${instanceId}`,
    { method: 'DELETE' }
  );
}
