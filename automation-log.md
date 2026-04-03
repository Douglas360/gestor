# gestor-ai automation log

## 2026-04-02T21:47:41-03:00
- Created `/root/gestor-ai/ROADMAP_AUTOMATION.md` with ordered heavy features and `next_feature_index: 1`.
- Backend worker: improved inbound webhook processing to (1) resolve and persist `instance_id` when possible and (2) skip duplicate inbound messages by `provider_message_id`.
- Build: `npm run -w @gestor/worker build` (ok).

## 2026-04-02T22:11:51-03:00
**Automation slice — Feature #1 (Auth + Multi-tenant + RLS) — backend scaffolding**
- API: added `TenantAuthGuard` (gated by env `AUTH_ENABLED=true`) and applied it to tenant-scoped controllers:
  - `v1/tenants/:tenantId/tasks` (CRUD + notify)
  - `v1/tenants/:tenantId/operators`
  - `v1/tenants/:tenantId/whatsapp/instances`
- DB client: extended `SupabaseService` to support validating a Supabase Auth access token via `SUPABASE_ANON_KEY` (`getUserFromAccessToken`).
- SQL (proposal): added `backend/supabase-auth-rls.sql` with `tenant_members` table + RLS enable + policies using `auth.uid()`.
- Env: updated `backend/.env.example` with `SUPABASE_ANON_KEY`, `AUTH_ENABLED`, `AUTH_STRICT`, `TENANT_MEMBERS_TABLE`.
- Build: `npm run -w @gestor/api build` (ok).

Notes:
- This slice enforces auth/membership at the API layer when enabled; it does **not** yet switch queries to a user-scoped Supabase client (still uses service role for DB ops). Next slice: introduce request-scoped Supabase client so RLS is actually exercised for dashboard traffic.

## 2026-04-02T22:48:00-03:00
**Automation slice — Feature #1 (Auth + Multi-tenant + RLS) — user-scoped Supabase client (RLS-ready)**
- API Auth: updated `TenantAuthGuard` to attach `req.authToken` (the Bearer access token) for downstream use.
- API DB: extended `SupabaseService` with `clientForAccessToken(token)` which builds a Supabase client using `SUPABASE_ANON_KEY` + `Authorization: Bearer <token>` header so queries can run as the logged-in user (RLS enforcement).
- Controllers: switched tenant-scoped controllers to use the user-scoped client when `req.authToken` is present:
  - `OperatorsController`
  - `TasksCrudController`
  - `TasksController` (notify endpoint)
  - `WhatsAppInstancesController`
- No DB migrations applied in this slice (only app-layer changes).
- Build: `npm run -w @gestor/api build` (ok).

## 2026-04-03T07:03:56-03:00
**Automation slice — UI: status colors + delete task (Dashboard)**
- Frontend (Next): added status “pill” w/ color + dot in the task list (Pendente / Em andamento / Em revisão / Concluída).
- Frontend (Next): right-side task header now shows a colored status badge (same mapping) instead of generic “Ativa/Concluída”.
- Frontend (Next): wired up **Delete task** in the task details header (trash icon w/ confirm) using existing API endpoint `DELETE /v1/tenants/:tenantId/tasks/:id`.
- Frontend state: implemented `deleteTask(id)` in `GestorContext` (removes from local state, adjusts selected task, then calls API).

Notes:
- `npm run lint` currently fails due to pre-existing `any` / hook-deps issues elsewhere; this slice focused on the requested UI functionality.
