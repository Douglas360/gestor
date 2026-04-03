-- Feature #1: Auth + Multi-tenant + RLS (proposal)
-- Apply in Supabase SQL editor AFTER reviewing.
-- Safe-ish to re-run, but ALWAYS test in a staging project first.

create extension if not exists pgcrypto;

-- 1) Tenant membership mapping (links Supabase Auth users to tenants)
create table if not exists tenant_members (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_members_user_idx on tenant_members(user_id);

-- 2) Enable RLS
alter table tenants enable row level security;
alter table tenant_members enable row level security;
alter table operators enable row level security;
alter table tasks enable row level security;
alter table task_events enable row level security;
alter table wa_instances enable row level security;
alter table wa_webhook_events enable row level security;
alter table wa_messages enable row level security;
alter table operator_state enable row level security;

-- 3) Helper: check membership
create or replace function is_tenant_member(tid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from tenant_members tm
    where tm.tenant_id = tid
      and tm.user_id = auth.uid()
  );
$$;

-- 4) Policies
-- Tenants: you can only see tenants you belong to
drop policy if exists tenants_select_member on tenants;
create policy tenants_select_member
on tenants for select
using (is_tenant_member(id));

-- tenant_members: members can see their own memberships
drop policy if exists tenant_members_select_self on tenant_members;
create policy tenant_members_select_self
on tenant_members for select
using (user_id = auth.uid());

-- operators/tasks/etc: enforce tenant_id scoping
-- Operators
drop policy if exists operators_tenant_member_all on operators;
create policy operators_tenant_member_all
on operators for all
using (is_tenant_member(tenant_id))
with check (is_tenant_member(tenant_id));

-- Tasks
drop policy if exists tasks_tenant_member_all on tasks;
create policy tasks_tenant_member_all
on tasks for all
using (is_tenant_member(tenant_id))
with check (is_tenant_member(tenant_id));

-- Task events
drop policy if exists task_events_tenant_member_all on task_events;
create policy task_events_tenant_member_all
on task_events for all
using (is_tenant_member(tenant_id))
with check (is_tenant_member(tenant_id));

-- WhatsApp instances
drop policy if exists wa_instances_tenant_member_all on wa_instances;
create policy wa_instances_tenant_member_all
on wa_instances for all
using (is_tenant_member(tenant_id))
with check (is_tenant_member(tenant_id));

-- WhatsApp webhook events
drop policy if exists wa_webhook_events_tenant_member_all on wa_webhook_events;
create policy wa_webhook_events_tenant_member_all
on wa_webhook_events for all
using (tenant_id is null or is_tenant_member(tenant_id))
with check (tenant_id is null or is_tenant_member(tenant_id));

-- WhatsApp messages
drop policy if exists wa_messages_tenant_member_all on wa_messages;
create policy wa_messages_tenant_member_all
on wa_messages for all
using (is_tenant_member(tenant_id))
with check (is_tenant_member(tenant_id));

-- Operator state
drop policy if exists operator_state_tenant_member_all on operator_state;
create policy operator_state_tenant_member_all
on operator_state for all
using (is_tenant_member(tenant_id))
with check (is_tenant_member(tenant_id));

-- Notes:
-- - For server-side jobs (worker/webhooks) you will keep using service role key (bypasses RLS).
-- - For dashboard/frontend, use SUPABASE_ANON_KEY + user access token so RLS applies.
