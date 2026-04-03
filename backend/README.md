# Backend (NestJS API + Worker)

This folder contains two NestJS apps plus a shared package:

- `apps/api` (HTTP API)
- `apps/worker` (pg-boss workers)
- `packages/shared` (types/zod)

The backend uses **Supabase Postgres** as:
- the primary database (tables in `public`)
- the job queue via **pg-boss** (schema `pgboss`)

WhatsApp integration is through **Evolution API** (Baileys).

---

## Production topology (current)

- API: `gestor-api.service` (listens on `:3011`)
- Worker: `gestor-worker.service`
- Nginx: `https://gestorapi.magicti.com` → `127.0.0.1:3011`

Webhook entry:
- `POST /webhooks/whatsapp/evolution`
- `POST /webhooks/whatsapp/evolution/:event` (Evolution `webhookByEvents=true`)

---

## Environment variables

Create `backend/.env` based on `backend/.env.example`.

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `SUPABASE_ANON_KEY` (required when `AUTH_ENABLED=true`)
- `DATABASE_URL` (Postgres connection string for pg-boss)
- `PG_BOSS_SCHEMA` (default `pgboss`)

Evolution:
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `PUBLIC_API_BASE_URL` (used when configuring webhook URL)

Auth:
- `AUTH_ENABLED=true|false`
- `AUTH_STRICT=true|false`

---

## Database & migrations

SQL files (execute in Supabase SQL editor):
- `supabase-mvp.sql`
- `supabase-ui-full.sql`
- `supabase-gestor-auth.sql` (profiles)
- `supabase-admin-notify.sql` (admin WA number)

Tables of interest:
- `tenants`: now includes `admin_wa_phone` (optional)
- `profiles`: membership/role for Auth (`gestor`/`operador`)
- `wa_instances`: instance registry + webhook_secret
- `wa_messages`: inbound/outbound messages (used for reply-thread task mapping)
- `wa_webhook_events`: raw webhook payload storage
- `task_events`: audit/history

---

## API modules and endpoints

### Health
- `GET /health`

### Auth
- `POST /v1/auth/bootstrap-gestor`
  - Ensures tenant exists where `tenant_id == user_id`.
  - Ensures `profiles` row exists for the user as `role=gestor`.

### Operators
- CRUD under `/v1/tenants/:tenantId/operators`
- Operators are **WhatsApp-only** (no login).

### Tasks
- CRUD under `/v1/tenants/:tenantId/tasks`
- On create (when `operator_id` is set), API enqueues `wa.outbound.send`.
- Events: `GET /v1/tenants/:tenantId/tasks/:taskId/events`

### WhatsApp instances
- `GET /v1/tenants/:tenantId/whatsapp/instances`
- `POST /v1/tenants/:tenantId/whatsapp/instances` (create + set webhook)
- `GET /v1/tenants/:tenantId/whatsapp/instances/:id/qr`
- `GET /v1/tenants/:tenantId/whatsapp/instances/:id/status`
- `DELETE /v1/tenants/:tenantId/whatsapp/instances/:id`

### Tenant settings
- `GET /v1/tenants/:tenantId/settings`
- `PATCH /v1/tenants/:tenantId/settings` (admin WA notification number)

---

## Worker queues (pg-boss)

Queues created on startup:
- `wa.inbound.process`
- `wa.outbound.send`
- `brain.decide_and_act`
- (placeholders) `wa.media.download`, `wa.audio.transcribe`, `sla.tick`, `realtime.publish`

### wa.outbound.send
- selects an OPEN/CONNECTED instance for tenant
- sends:
  - plain text fallback (stored in `wa_messages` with provider_message_id)
  - interactive buttons (stored in `wa_messages`)
- updates `operator_state.current_task_id`

### wa.inbound.process
- loads raw webhook payload from `wa_webhook_events` via idempotency key
- ignores `fromMe=true`
- stores inbound into `wa_messages`
- extracts reply threading id `contextInfo.stanzaId` when present
- enqueues `brain.decide_and_act`

### brain.decide_and_act
- button path: `task:<uuid>|action:<start|photo|finish>`
- text path: keyword intent detection
- task resolution order:
  1) UUID present in message
  2) **reply threading**: map `stanzaId` -> our outbound `wa_messages.provider_message_id` -> `task_id`
  3) `operator_state.current_task_id`
- updates task status + writes `task_events.status.changed`
- sends confirmation to operator
- notifies gestor:
  - prefers `tenants.admin_wa_phone`
  - fallback to instance ownerJid

---

## Local development

```bash
cd backend
npm install

# API
npm run -w @gestor/api dev

# Worker
npm run -w @gestor/worker dev
```

---

## Troubleshooting

### Evolution webhooks returning 404
Ensure API supports both:
- `/webhooks/whatsapp/evolution`
- `/webhooks/whatsapp/evolution/<event>`

### Operator replied but wrong task updated
Ensure outbound fallback messages are stored in `wa_messages` so `stanzaId` mapping works.

### No webhook tenant resolution
We resolve tenant primarily via `wa_instances.instance_name -> tenant_id`.
Do not hard-delete instances; prefer soft-delete (status).

---

## Security note
Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
