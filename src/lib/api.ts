export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gestorapi.magicti.com';
export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ data: ApiOperator[] }>(`/v1/tenants/${TENANT_ID}/operators`);
}

export async function createOperator(input: { name: string; wa_phone: string; active?: boolean; email?: string | null; role?: string | null; avatar_url?: string | null }) {
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<ApiOperator>(`/v1/tenants/${TENANT_ID}/operators`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateOperator(
  id: string,
  patch: Partial<{ name: string; wa_phone: string; active: boolean; email: string | null; role: string | null; avatar_url: string | null }>
) {
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<ApiOperator>(`/v1/tenants/${TENANT_ID}/operators/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export async function deleteOperator(id: string) {
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ ok: true }>(`/v1/tenants/${TENANT_ID}/operators/${id}`, { method: 'DELETE' });
}

// Tasks
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
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ data: ApiTask[] }>(`/v1/tenants/${TENANT_ID}/tasks`);
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
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<ApiTask>(`/v1/tenants/${TENANT_ID}/tasks`, {
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
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<ApiTask>(`/v1/tenants/${TENANT_ID}/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export async function deleteTask(id: string) {
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ ok: true }>(`/v1/tenants/${TENANT_ID}/tasks/${id}`, { method: 'DELETE' });
}

export async function notifyTask(id: string) {
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ ok: true }>(`/v1/tenants/${TENANT_ID}/tasks/${id}/notify`, { method: 'POST', body: '{}' });
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
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ data: ApiWaInstance[] }>(`/v1/tenants/${TENANT_ID}/whatsapp/instances`);
}

export async function createWaInstance(input?: { instanceName?: string }) {
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ instance: ApiWaInstance; evolution: any }>(`/v1/tenants/${TENANT_ID}/whatsapp/instances`, {
    method: 'POST',
    body: JSON.stringify(input || {})
  });
}

export async function getWaQr(instanceId: string) {
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ ok: true; instance_name: string; qr: any }>(`/v1/tenants/${TENANT_ID}/whatsapp/instances/${instanceId}/qr`);
}

export async function getWaStatus(instanceId: string) {
  if (!TENANT_ID) throw new Error('NEXT_PUBLIC_TENANT_ID not set');
  return apiFetch<{ ok: true; instance_name: string; evolution: any; saved_status: string | null }>(
    `/v1/tenants/${TENANT_ID}/whatsapp/instances/${instanceId}/status`
  );
}
