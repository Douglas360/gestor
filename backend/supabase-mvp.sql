-- MVP schema for Gestor-AI (single tenant / single user for now)
-- Apply in Supabase SQL editor.

create extension if not exists pgcrypto;

-- Tenants
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Operators (field workers)
create table if not exists operators (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  wa_phone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, wa_phone)
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'created',
  operator_id uuid null references operators(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_tenant_idx on tasks(tenant_id);
create index if not exists tasks_operator_idx on tasks(operator_id);

-- Task events (audit/timeline)
create table if not exists task_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists task_events_task_idx on task_events(task_id);

-- WhatsApp instances (Evolution)
create table if not exists wa_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  instance_name text not null,
  instance_token text not null,
  webhook_secret text not null,
  evolution_host text,
  status text not null default 'created',
  created_at timestamptz not null default now(),
  unique (tenant_id, instance_name)
);

-- Raw webhook events (debug + idempotency)
create table if not exists wa_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references tenants(id) on delete set null,
  instance_name text null,
  idempotency_key text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

-- WhatsApp messages (normalized)
create table if not exists wa_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid null references tasks(id) on delete set null,
  operator_id uuid null references operators(id) on delete set null,
  instance_id uuid null references wa_instances(id) on delete set null,
  direction text not null, -- in|out
  provider_message_id text null,
  message_type text not null default 'unknown',
  text text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists wa_messages_task_idx on wa_messages(task_id);
create index if not exists wa_messages_operator_idx on wa_messages(operator_id);
create index if not exists wa_messages_tenant_idx on wa_messages(tenant_id);

-- Operator conversation state
create table if not exists operator_state (
  operator_id uuid primary key references operators(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  current_task_id uuid null references tasks(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Auto-update tasks.updated_at
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at before update on tasks
for each row execute function set_updated_at();

-- RLS: for now keep disabled for MVP (single user). Enable later when auth/tenancy is ready.
-- alter table tenants enable row level security;
-- alter table operators enable row level security;
-- alter table tasks enable row level security;
-- alter table task_events enable row level security;
-- alter table wa_instances enable row level security;
-- alter table wa_webhook_events enable row level security;
-- alter table wa_messages enable row level security;
-- alter table operator_state enable row level security;
