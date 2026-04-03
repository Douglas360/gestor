# Frontend (Next.js Dashboard)

This is the **Gestor AI** dashboard built with Next.js (App Router).

It is designed for **Gestor** users only:
- Gestor logs in
- creates operators and tasks
- monitors task status and history
- manages WhatsApp (Evolution) instances

Operators do **not** log in; they interact only via WhatsApp.

---

## Pages

- `/` Dashboard (tasks list + detail + history)
- `/tarefas/nova` Create task
- `/equipe` Operators
- `/configuracoes` WhatsApp instances + admin notifications number
- `/login` Gestor login
- `/cadastro` Gestor signup
- `/sair` Logout

---

## Authentication (client-side)

We use Supabase Auth from the browser:
- `signUp` (cadastro)
- `signInWithPassword` (login)

After login/signup we store:
- `localStorage['gestor.authToken']` = Supabase `access_token`
- `localStorage['gestor.tenantId']` = returned by `/v1/auth/bootstrap-gestor`

All API requests automatically include:
- `Authorization: Bearer <access_token>`

### Redirect behavior
If not logged in, the app redirects to `/login`.
Public routes:
- `/login`
- `/cadastro`

---

## Environment variables

Create `frontend/.env.local`:

- `NEXT_PUBLIC_API_BASE_URL` (ex: `https://gestorapi.magicti.com`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:
- `NEXT_PUBLIC_TENANT_ID`
  - legacy MVP default (used only when not authenticated). Keep empty for multi-gestor.

---

## Running locally

```bash
cd frontend
npm install
npm run dev
```

---

## Notes for LLMs continuing work

### Where API calls live
- `src/lib/api.ts`

### App state and CRUD
- `src/context/GestorContext.tsx`

### WhatsApp settings UI
- `src/app/configuracoes/page.tsx`
  - now includes `admin_wa_phone` (independent admin notifications number)

### Task history
- History renders from `task_events`.

### Common pitfalls
- If the backend has `AUTH_ENABLED=true`, every API call must send a Bearer token.
- Supabase can throw `email rate limit exceeded` when signup triggers confirmation emails.

---

## Deployment on VPS (current)

- systemd service: `gestor-frontend`
- port: `:3010`

(Backend is separate; see `../backend/README.md`)
