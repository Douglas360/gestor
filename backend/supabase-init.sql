-- Minimal tables to get API + worker running today.
-- Apply in Supabase SQL editor.

create extension if not exists pgcrypto;

-- Tenants
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

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

-- Raw webhook events (audit + debugging + idempotency)
create table if not exists wa_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references tenants(id) on delete set null,
  instance_name text null,
  idempotency_key text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists wa_webhook_events_idempotency_key_idx on wa_webhook_events(idempotency_key);
create index if not exists wa_webhook_events_tenant_idx on wa_webhook_events(tenant_id);

-- pg-boss will create its own tables in schema "pgboss" when the worker starts.
