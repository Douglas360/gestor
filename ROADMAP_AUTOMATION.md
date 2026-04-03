# Gestor-AI — Roadmap Automation

next_feature_index: 1

## Heavy features (ordered)
1. Auth + Multi-tenant + RLS (Supabase Auth)
2. Media/evidence pipeline (download/store/link)
3. Operator conversation state machine
4. Full task UI CRUD + timeline
5. pg-boss observability + retries/DLQ tooling
6. SLA + reminders + escalation
7. Idempotency/dedup for inbound WA events
8. Roles/permissions across UI + audit

## Notes
- Implement in small slices.
- Avoid DB changes without explicit approval; propose SQL first.
