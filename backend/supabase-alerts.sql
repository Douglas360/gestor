-- supabase-alerts.sql
-- Scheduled administrative WhatsApp alerts per tenant (pg-boss schedule)

begin;

create table if not exists public.tenant_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null default 'Alerta',
  date_mode text not null check (date_mode in ('overdue','due_today')),
  statuses text[] not null default '{created,in_progress,awaiting_evidence}',
  cron text not null,
  timezone text not null default 'America/Sao_Paulo',
  enabled boolean not null default true,
  last_sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenant_alerts_tenant_id on public.tenant_alerts(tenant_id);

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tenant_alerts_touch on public.tenant_alerts;
create trigger trg_tenant_alerts_touch
before update on public.tenant_alerts
for each row execute procedure public.touch_updated_at();

commit;
