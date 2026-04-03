-- supabase-admin-notify.sql
-- Adds independent admin notification WhatsApp number per tenant (gestor)

begin;

alter table public.tenants
  add column if not exists admin_wa_phone text null;

commit;
