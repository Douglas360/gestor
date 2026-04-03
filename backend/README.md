# Gestor (API + Worker)

## Hoje (MVP em produção)

### 0) Segurança
- Rotacione a **SUPABASE_SERVICE_ROLE_KEY** (vazou no Discord).
- Nunca use service role no frontend.

### 1) Criar tabelas no Supabase
Cole e rode `supabase-init.sql` no SQL editor.

### 2) Configurar env
Crie `.env` (use `.env.example`).
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (string de conexão do Postgres do Supabase) — necessária pro pg-boss
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `PUBLIC_API_BASE_URL` (ex: https://gestorapi.seudominio.com)

### 3) Rodar
Em 2 processos:

```bash
cd /root/gestor-ai/backend
npm run -w @gestor/api dev
npm run -w @gestor/worker dev
```

### 4) Testes rápidos
- API health: `GET /health`
- Criar instância: `POST /v1/tenants/:tenantId/whatsapp/instances`
- Webhook: `POST /webhooks/whatsapp/evolution`

## Próximos passos (ainda hoje)
- Confirmar endpoints de QR + status no Swagger da sua Evolution e implementar `getQrCode()` / `getStatus()`.
- Implementar jobs reais:
  - `wa.inbound.process` normalizar e resolver tenant/instance
  - `wa.outbound.send` enviar mensagens
  - `brain.decide_and_act` (rules + IA)
