-- supabase-gestor-auth.sql
-- Multi-user auth scaffolding: Gestor (tenant owner) + Operador (belongs to Gestor)
-- Tenant == Gestor workspace.

begin;

-- 1) profiles: one row per auth user
create table if not exists public.profiles (
  user_id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('gestor','operador')),
  gestor_user_id uuid null,
  created_at timestamptz not null default now()
);

-- Ensure operator must have gestor_user_id; gestor must not.
create or replace function public.profiles_role_guard()
returns trigger as $$
begin
  if new.role = 'gestor' and new.gestor_user_id is not null then
    raise exception 'gestor_user_id must be null for role=gestor';
  end if;
  if new.role = 'operador' and new.gestor_user_id is null then
    raise exception 'gestor_user_id is required for role=operador';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_role_guard on public.profiles;
create trigger trg_profiles_role_guard
before insert or update on public.profiles
for each row execute procedure public.profiles_role_guard();

create index if not exists idx_profiles_tenant_id on public.profiles(tenant_id);
create index if not exists idx_profiles_gestor_user_id on public.profiles(gestor_user_id);

-- 2) operators can be linked to an auth user (login)
alter table public.operators
  add column if not exists user_id uuid null;

create index if not exists idx_operators_user_id on public.operators(user_id);

commit;
