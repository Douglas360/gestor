# Gestor AI (Monorepo)

This repository contains a production MVP of **Gestor AI**: a task management dashboard + a NestJS backend (API + Worker) integrated with **WhatsApp (Evolution API / Baileys)** and **Supabase Postgres**.

> **Target audience:** humans and LLMs continuing the project. This README is intentionally explicit and operational.

---

## Repository layout

```
./backend/   # NestJS API + Worker (pg-boss) + shared package + SQL migrations
./frontend/  # Next.js dashboard
```

---

## What the system does (MVP)

### Core entities
- **Tenant**: a workspace owned by a **Gestor** (in the current model: `tenant_id == gestor_user_id`).
- **Operator (operador)**: a person who receives tasks via WhatsApp and updates them by replying.
- **Task (tarefa)**: has status transitions, history, priority, due date, tags, etc.

### Key integrations
- **Supabase Postgres**
  - Stores app data (tasks/operators/events/messages)
  - Also runs the queue via **pg-boss** (schema `pgboss`)
- **Evolution API (WhatsApp Baileys)**
  - Outbound: send task notifications (text fallback + interactive buttons)
  - Inbound: webhook events -> jobs -> status updates

---

## End-to-end flows

### A) Create task → notify operator (outbound)
1. Dashboard creates a task via API (`POST /v1/tenants/:tenantId/tasks`).
2. API enqueues `wa.outbound.send` (pg-boss).
3. Worker picks an **OPEN** Evolution instance for the tenant.
4. Worker sends:
   - **plain-text fallback** (most reliable)
   - **interactive buttons** (best-effort)
5. Worker records:
   - `wa_messages` (outbound) including provider message id
   - `task_events` (`task.notify.enqueued`, `wa.notified`)
   - `operator_state.current_task_id = task_id`

### B) Operator replies → update task (inbound)
1. Evolution calls webhook:
   - `POST /webhooks/whatsapp/evolution` **or** `POST /webhooks/whatsapp/evolution/<event>` (webhookByEvents)
2. API stores `wa_webhook_events` and enqueues `wa.inbound.process`.
3. Worker:
   - ignores `fromMe=true` (loop prevention)
   - stores inbound message in `wa_messages`
   - enqueues `brain.decide_and_act`
4. `brain.decide_and_act`:
   - If **button** payload: deterministic task/action.
   - If **text**: keyword inference (iniciar/foto/feito).
   - **Multi-task safety:** if operator used WhatsApp “reply”, we map `contextInfo.stanzaId` to our outbound message in `wa_messages` to resolve the correct `task_id`.
5. Worker updates `tasks.status`, inserts `task_events.status.changed`, sends confirmation to operator.

### C) Notify the Gestor when operator updates
When a task status is updated from inbound WhatsApp, Worker sends an admin notification:
- **Preferred destination:** `tenants.admin_wa_phone` (independent admin number)
- Fallback: `ownerJid` of the Evolution instance

---

## Production deployment (current VPS)

### Services
- **Frontend (Next.js)**: systemd `gestor-frontend` on `:3010`
- **API (NestJS)**: systemd `gestor-api` on `:3011`
- **Worker (NestJS)**: systemd `gestor-worker`

### Networking
- API is behind Nginx + SSL:
  - `https://gestorapi.magicti.com` → `127.0.0.1:3011`

---

## Authentication model (current)

- Only **Gestor** logs into the dashboard.
- Operator has **no login**; acts only via WhatsApp.
- Frontend stores:
  - `gestor.authToken` (Supabase access_token)
  - `gestor.tenantId` (returned by `/v1/auth/bootstrap-gestor`)

Backend enforcement:
- `AUTH_ENABLED=true` and `AUTH_STRICT=true` require `Authorization: Bearer <token>`.
- `TenantAuthGuard` checks membership using `public.profiles`.

---

## Database

The backend folder contains SQL files meant to be executed in Supabase SQL editor:
- `backend/supabase-mvp.sql` (initial)
- `backend/supabase-ui-full.sql` (UI persistence extensions)
- `backend/supabase-gestor-auth.sql` (profiles scaffolding)
- `backend/supabase-admin-notify.sql` (admin notification number)

Core tables (public schema):
- `tenants`
- `profiles`
- `operators`
- `operator_state`
- `tasks`
- `task_events`
- `wa_instances`
- `wa_messages`
- `wa_webhook_events`

Queue schema:
- `pgboss` (managed by pg-boss)

---

## Where to continue (LLM-friendly TODOs)

1) **Auth UX hardening**
- Handle Supabase `email rate limit exceeded` (better messaging / alternative signup strategy).
- Add a proper “session restore” using `@supabase/supabase-js` instead of only localStorage.

2) **Task UI**
- Edit/delete task flows; consistent status colors across list/detail.

3) **RLS**
- Current API uses service role in many places. For real security, complete RLS and use `clientForAccessToken` everywhere.

4) **WhatsApp reliability**
- Improve operator identification and reduce ambiguous number matching.
- Expand media flow (`photo` evidence, attachments).

---

## Quick commands (dev)

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend (API + Worker):
```bash
cd backend
npm install
npm run -w @gestor/api dev
npm run -w @gestor/worker dev
```

---

## Notes
- Do **not** commit `.env` files.
- If you change webhook behavior, test both:
  - `/webhooks/whatsapp/evolution`
  - `/webhooks/whatsapp/evolution/messages-upsert`
