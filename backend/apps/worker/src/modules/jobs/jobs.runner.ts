import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Job } from 'pg-boss';
import { BossService } from '../boss/boss.service.js';
import { SupabaseService } from '../db/supabase.service.js';
import { EvolutionService } from '../whatsapp/evolution.service.js';

@Injectable()
export class JobsRunner implements OnModuleInit {
  constructor(
    private readonly boss: BossService,
    private readonly supabase: SupabaseService,
    private readonly evolution: EvolutionService
  ) {}

  private async pickAnyOpenInstanceName(tenantId: string): Promise<string | null> {
    const { data: insts } = await this.supabase.client
      .from('wa_instances')
      .select('instance_name')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    for (const inst of insts || []) {
      try {
        const st = await this.evolution.getStatus(inst.instance_name);
        const state = String(st?.instance?.state || st?.state || '').toLowerCase();
        if (state === 'open' || state === 'connected') return inst.instance_name;
      } catch {
        // ignore
      }
    }

    return insts?.[0]?.instance_name || null;
  }

  async onModuleInit() {
    const fmtDate = (d: any) => {
      if (!d) return null;
      try {
        const s = String(d);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[3]}/${m[2]}/${m[1]}`;
        const dt = new Date(s);
        if (Number.isNaN(dt.getTime())) return s;
        const dd = String(dt.getUTCDate()).padStart(2, '0');
        const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const yy = dt.getUTCFullYear();
        return `${dd}/${mm}/${yy}`;
      } catch {
        return String(d);
      }
    };

    const statusLabel = (st: string) =>
      st === 'completed'
        ? 'Concluída'
        : st === 'in_progress'
          ? 'Em andamento'
          : st === 'awaiting_evidence'
            ? 'Aguardando evidência'
            : st;

    const notifyGestor = async (input: {
      tenantId: string;
      instanceName?: string;
      taskId: string;
      nextStatus: string;
      operatorName?: string | null;
    }) => {
      const inst = input.instanceName;
      if (!inst) return;

      // Prefer tenant-configured admin number (independent notifications), fallback to instance ownerJid
      let toNumber: string | null = null;
      try {
        const { data: ten } = await this.supabase.client
          .from('tenants')
          .select('admin_wa_phone')
          .eq('id', input.tenantId)
          .maybeSingle();
        const cfg = String((ten as any)?.admin_wa_phone || '').trim();
        if (cfg) toNumber = cfg;
      } catch {
        // ignore
      }

      if (!toNumber) {
        const ownerJid = await this.evolution.getOwnerJid(inst);
        if (!ownerJid) return;
        const digits = String(ownerJid).replace(/\D+/g, '');
        toNumber = digits ? `+${digits}` : ownerJid;
      }

      // normalize to +digits when possible
      const d2 = String(toNumber).replace(/\D+/g, '');
      if (d2) toNumber = `+${d2}`;

      const { data: task } = await this.supabase.client
        .from('tasks')
        .select('id, title, due_date, operator_id')
        .eq('tenant_id', input.tenantId)
        .eq('id', input.taskId)
        .maybeSingle();

      let opName = input.operatorName || null;
      if (!opName && task?.operator_id) {
        const { data: op } = await this.supabase.client
          .from('operators')
          .select('name')
          .eq('tenant_id', input.tenantId)
          .eq('id', task.operator_id)
          .maybeSingle();
        opName = (op?.name as any) ?? null;
      }

      const shortId = String(input.taskId).split('-')[0];
      const due = fmtDate((task as any)?.due_date);

      await this.evolution.sendText(inst, {
        to: toNumber,
        text: [
          `📣 Atualização de tarefa`,
          task?.title ? `📌 ${task.title}` : null,
          opName ? `👤 Operador: ${opName}` : null,
          due ? `🗓 Prazo: ${due}` : null,
          `📍 Status: ${statusLabel(input.nextStatus)}`,
          `🆔 ${shortId}`
        ]
          .filter(Boolean)
          .join('\n')
      });

      await this.supabase.client.from('task_events').insert({
        tenant_id: input.tenantId,
        task_id: input.taskId,
        kind: 'gestor.notified',
        data: { to: toNumber, nextStatus: input.nextStatus, via: 'wa' }
      });
    };
    // Ensure queues exist before starting workers
    const queues = ['wa.inbound.process', 'wa.outbound.send', 'brain.decide_and_act', 'alerts.check_and_notify', 'wa.media.download', 'wa.audio.transcribe', 'sla.tick', 'realtime.publish'];
    for (const name of queues) {
      try {
        await this.boss.client.createQueue(name);
      } catch {
        // ignore if already exists
      }
    }

    // Ensure schedules exist for enabled alerts (in case API scheduled before queue existed)
    try {
      const { data: alerts } = await this.supabase.client
        .from('tenant_alerts')
        .select('id, tenant_id, cron, timezone, enabled')
        .eq('enabled', true)
        .limit(200);

      for (const a of alerts || []) {
        try {
          await this.boss.client.schedule(
            'alerts.check_and_notify',
            (a as any).cron,
            { tenantId: (a as any).tenant_id, alertId: (a as any).id },
            { tz: (a as any).timezone || 'America/Sao_Paulo', key: `tenant_alert/${(a as any).id}` }
          );
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    await this.boss.client.work(
      'wa.inbound.process',
      { batchSize: 1, localConcurrency: 4 },
      async (jobs: Job[]) => {
        for (const job of jobs) {
          const { tenantId, instanceName, idempotencyKey } = (job.data as any) || {};

          const { data: evt, error } = await this.supabase.client
            .from('wa_webhook_events')
            .select('*')
            .eq('idempotency_key', idempotencyKey)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw new Error(error.message);
          if (!evt) continue;

          const payload = evt.payload as any;

          // Ignore messages sent by us (fromMe) to prevent loops
          const isFromMe = Boolean(
            payload?.data?.key?.fromMe ||
            payload?.data?.fromMe ||
            payload?.fromMe
          );
          if (isFromMe) continue;

          // Best-effort parse inbound message
          const from =
            payload?.data?.key?.remoteJid ||
            payload?.data?.from ||
            payload?.data?.sender ||
            payload?.from ||
            null;

          const selectedButtonId =
            payload?.data?.message?.buttonsResponseMessage?.selectedButtonId ||
            payload?.data?.message?.templateButtonReplyMessage?.selectedId ||
            payload?.data?.selectedButtonId ||
            null;

          const text =
            payload?.data?.message?.conversation ||
            payload?.data?.message?.extendedTextMessage?.text ||
            payload?.data?.text ||
            null;

          // If the operator used "reply" on WhatsApp, Evolution includes stanzaId of the quoted message
          const replyToProviderMessageId =
            payload?.data?.contextInfo?.stanzaId ||
            payload?.data?.message?.extendedTextMessage?.contextInfo?.stanzaId ||
            payload?.data?.message?.contextInfo?.stanzaId ||
            null;

          // Resolve instance_id (best-effort) so we can correlate inbound messages later
          let instanceId: string | null = null;
          if (tenantId && instanceName) {
            const { data: inst } = await this.supabase.client
              .from('wa_instances')
              .select('id')
              .eq('tenant_id', tenantId)
              .eq('instance_name', instanceName)
              .maybeSingle();
            instanceId = (inst?.id as any) ?? null;
          }

          const providerMessageId = payload?.data?.key?.id || payload?.messageId || null;

          // Idempotency guard: if we've already stored this inbound provider message id, skip
          if (providerMessageId) {
            const { data: existing } = await this.supabase.client
              .from('wa_messages')
              .select('id')
              .eq('tenant_id', tenantId)
              .eq('direction', 'in')
              .eq('provider_message_id', providerMessageId)
              .limit(1)
              .maybeSingle();

            if (existing?.id) continue;
          }

          // Persist inbound message (raw)
          await this.supabase.client.from('wa_messages').insert({
            tenant_id: tenantId,
            instance_id: instanceId,
            direction: 'in',
            provider_message_id: providerMessageId,
            message_type: selectedButtonId ? 'button' : text ? 'text' : 'unknown',
            text: text,
            payload
          });

          // Route to brain
          await this.boss.client.send('brain.decide_and_act', {
            tenantId,
            instanceName,
            from,
            selectedButtonId,
            text,
            replyToProviderMessageId
          });
        }
      }
    );

    await this.boss.client.work('wa.outbound.send', { batchSize: 1, localConcurrency: 2 }, async (jobs: Job[]) => {
      for (const job of jobs) {
        const { tenantId, taskId, operatorId, instanceName } = (job.data as any) || {};
        if (!tenantId || !taskId) continue;

        // Resolve instance (prefer an OPEN connection)
        let instName = instanceName as string | undefined;
        if (!instName) {
          const { data: insts, error: instErr } = await this.supabase.client
            .from('wa_instances')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(5);
          if (instErr) throw new Error(instErr.message);

          for (const inst of insts || []) {
            try {
              const st = await this.evolution.getStatus(inst.instance_name);
              const state = String(st?.instance?.state || st?.state || '').toLowerCase();
              if (state === 'open' || state === 'connected') {
                instName = inst.instance_name;
                break;
              }
            } catch {
              // ignore and try next
            }
          }

          // fallback: latest instance even if status check failed
          if (!instName && insts && insts.length > 0) instName = insts[0]!.instance_name;
        }

        if (!instName) {
          const attempts = Number((job.data as any)?.attempts || 0);
          if (attempts < 30) {
            // If WhatsApp instance isn't connected/created yet, retry later (do not fail the job)
            await this.boss.client.send(
              'wa.outbound.send',
              { ...(job.data as any), attempts: attempts + 1 },
              { startAfter: new Date(Date.now() + 60_000) }
            );

            await this.supabase.client.from('task_events').insert({
              tenant_id: tenantId,
              task_id: taskId,
              kind: 'wa.notify.deferred',
              data: { reason: 'no_instance', attempts: attempts + 1 }
            });

            continue;
          }

          throw new Error('No wa_instances found for tenant');
        }

        // Load task + operator
        const { data: task, error: taskErr } = await this.supabase.client
          .from('tasks')
          .select('id, title, description, status, operator_id, priority, due_date, tags')
          .eq('tenant_id', tenantId)
          .eq('id', taskId)
          .single();
        if (taskErr) throw new Error(taskErr.message);

        const opId = operatorId || task.operator_id;
        if (!opId) throw new Error('Task has no operator');

        const { data: op, error: opErr } = await this.supabase.client
          .from('operators')
          .select('id, wa_phone, name')
          .eq('tenant_id', tenantId)
          .eq('id', opId)
          .single();
        if (opErr) throw new Error(opErr.message);

        // Buttons payload
        const btn = (action: string) => `task:${task.id}|action:${action}`;

        const shortId = String(task.id).split('-')[0];
        const fmtDate = (d: any) => {
          if (!d) return null;
          try {
            // Supabase may return YYYY-MM-DD
            const s = String(d);
            const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m) return `${m[3]}/${m[2]}/${m[1]}`;
            const dt = new Date(s);
            if (Number.isNaN(dt.getTime())) return s;
            const dd = String(dt.getUTCDate()).padStart(2, '0');
            const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
            const yy = dt.getUTCFullYear();
            return `${dd}/${mm}/${yy}`;
          } catch {
            return String(d);
          }
        };

        const due = fmtDate((task as any).due_date);
        const prio = (task as any).priority ? String((task as any).priority) : null;
        const tags = Array.isArray((task as any).tags) ? (task as any).tags : [];

        // Always send a plain-text fallback first (more reliable delivery/visibility)
        const fallbackText = [
          `🆕 *Nova tarefa*`,
          `📌 ${task.title}`,
          task.description ? `📝 ${task.description}` : null,
          due ? `🗓 Vencimento: ${due}` : null,
          prio ? `⚡ Prioridade: ${prio}` : null,
          tags.length ? `🏷 Tags: ${tags.join(', ')}` : null,
          ``,
          `🆔 ID: ${shortId} (completo: ${task.id})`,
          `📍 Status: ${task.status}`,
          ``,
          `Responda: *iniciar* | *foto* | *concluir* (ou *feito*)`
        ]
          .filter(Boolean)
          .join('\n');

        const textResp = await this.evolution.sendText(instName, {
          to: op.wa_phone,
          text: fallbackText
        });

        // Store fallback message too, so threaded replies can map back to the correct task
        await this.supabase.client.from('wa_messages').insert({
          tenant_id: tenantId,
          task_id: task.id,
          operator_id: op.id,
          direction: 'out',
          provider_message_id: textResp?.key?.id || textResp?.messageId || null,
          message_type: 'text',
          text: fallbackText,
          payload: textResp
        });

        const evoResp = await this.evolution.sendButtons(instName, {
          to: op.wa_phone,
          title: '🆕 Nova tarefa',
          body: [
            `📌 ${task.title}`,
            task.description ? `📝 ${task.description}` : null,
            due ? `🗓 Vencimento: ${due}` : null,
            prio ? `⚡ Prioridade: ${prio}` : null,
            tags.length ? `🏷 Tags: ${tags.join(', ')}` : null,
            ``,
            `🆔 ${shortId}`
          ]
            .filter(Boolean)
            .join('\n')
            .trim(),
          footer: `Status: ${task.status}`,
          buttons: [
            { id: btn('start'), text: '▶️ Iniciar' },
            { id: btn('photo'), text: '📸 Enviar foto' },
            { id: btn('finish'), text: '✅ Concluir' }
          ]
        });

        await this.supabase.client.from('wa_messages').insert({
          tenant_id: tenantId,
          task_id: task.id,
          operator_id: op.id,
          direction: 'out',
          provider_message_id: evoResp?.key?.id || evoResp?.messageId || null,
          message_type: 'interactive',
          text: null,
          payload: evoResp
        });

        await this.supabase.client.from('task_events').insert({
          tenant_id: tenantId,
          task_id: task.id,
          kind: 'wa.notified',
          data: { operatorId: op.id }
        });

        await this.supabase.client.from('operator_state').upsert({
          operator_id: op.id,
          tenant_id: tenantId,
          current_task_id: task.id,
          updated_at: new Date().toISOString()
        });
      }
    });

    await this.boss.client.work('alerts.check_and_notify', { batchSize: 1, localConcurrency: 1 }, async (jobs: Job[]) => {
      for (const job of jobs) {
        const { tenantId, alertId } = (job.data as any) || {};
        if (!tenantId || !alertId) continue;

        // load alert + tenant
        const { data: alert } = await this.supabase.client
          .from('tenant_alerts')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('id', alertId)
          .maybeSingle();

        if (!alert?.enabled) continue;

        // Destination: prefer admin_wa_phone, fallback to instance ownerJid
        const { data: ten } = await this.supabase.client.from('tenants').select('admin_wa_phone').eq('id', tenantId).maybeSingle();
        let admin = String((ten as any)?.admin_wa_phone || '').trim();

        if (!admin) {
          // fallback to ownerJid of any open instance
          const instName = await this.pickAnyOpenInstanceName(tenantId);
          if (!instName) continue;
          const ownerJid = await this.evolution.getOwnerJid(instName);
          if (!ownerJid) continue;
          const digits = String(ownerJid).replace(/\D+/g, '');
          admin = digits ? `+${digits}` : ownerJid;
        }

        // normalize to +digits when possible
        const digits2 = String(admin).replace(/\D+/g, '');
        const toNumber = digits2 ? `+${digits2}` : admin;

        const statuses = Array.isArray((alert as any)?.statuses) ? (alert as any).statuses : [];

        const tz = String((alert as any)?.timezone || 'UTC');
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD

        // Query tasks according to date_mode
        let q = this.supabase.client
          .from('tasks')
          .select('id, title, status, due_date, priority')
          .eq('tenant_id', tenantId)
          .not('due_date', 'is', null);

        if (statuses.length) {
          q = q.in('status', statuses);
        }

        if ((alert as any).date_mode === 'overdue') {
          q = q.lt('due_date', todayStr);
        } else {
          q = q.eq('due_date', todayStr);
        }

        const { data: tasks } = await q.order('due_date', { ascending: true }).limit(10);
        const list = (tasks || []) as any[];

        // No message when empty (product rule)
        if (!list.length) {
          await this.supabase.client.from('wa_messages').insert({
            tenant_id: tenantId,
            direction: 'out',
            message_type: 'admin_alert_check',
            text: null,
            payload: { kind: 'alert.checked', alertId, mode: (alert as any).date_mode, count: 0, today: todayStr }
          });
          continue;
        }

        const fmt = (d: any) => {
          if (!d) return '';
          const s = String(d);
          const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
          return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
        };
        const shortId = (id: string) => String(id).split('-')[0];

        const header =
          (alert as any).date_mode === 'overdue'
            ? `⏰ *Tarefas atrasadas* (${list.length})`
            : `📅 *Tarefas vencendo hoje* (${list.length})`;

        const lines = list.map((t) => {
          const due = fmt(t.due_date);
          return `• ${t.title} (${shortId(t.id)})${due ? ` — ${due}` : ''}`;
        });

        const instName = (job.data as any)?.instanceName || (await this.pickAnyOpenInstanceName(tenantId));
        if (!instName) continue;

        const textToSend = [header, ...lines].join('\n');
        const evo = await this.evolution.sendText(instName, {
          to: toNumber,
          text: textToSend
        });

        await this.supabase.client.from('wa_messages').insert({
          tenant_id: tenantId,
          direction: 'out',
          message_type: 'admin_alert',
          provider_message_id: (evo as any)?.key?.id || (evo as any)?.messageId || null,
          text: textToSend,
          payload: { evo, alertId, mode: (alert as any).date_mode, count: list.length }
        });
      }
    });

    await this.boss.client.work('brain.decide_and_act', { batchSize: 1, localConcurrency: 2 }, async (jobs: Job[]) => {
      for (const job of jobs) {
        const { tenantId, instanceName, selectedButtonId, from, text, replyToProviderMessageId } = (job.data as any) || {};
        if (!tenantId) continue;

        // Resolve instance name for replies
        let replyInstanceName = instanceName as string | undefined;
        if (!replyInstanceName) {
          const { data: insts } = await this.supabase.client
            .from('wa_instances')
            .select('instance_name')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(5);
          replyInstanceName = insts?.[0]?.instance_name;
        }

        // 1) Button path (preferred)
        if (selectedButtonId && typeof selectedButtonId === 'string') {
          const m = selectedButtonId.match(/task:([0-9a-fA-F-]+)\|action:([a-z_]+)/);
          if (!m) continue;
          const taskId = m[1];
          const action = m[2];

          const nextStatus =
            action === 'start'
              ? 'in_progress'
              : action === 'finish'
                ? 'completed'
                : action === 'photo'
                  ? 'awaiting_evidence'
                  : null;

          if (!nextStatus) continue;

          await this.supabase.client
            .from('tasks')
            .update({ status: nextStatus })
            .eq('tenant_id', tenantId)
            .eq('id', taskId);

          await this.supabase.client.from('task_events').insert({
            tenant_id: tenantId,
            task_id: taskId,
            kind: 'status.changed',
            data: { action, nextStatus, from, via: 'button' }
          });

          // notify gestor (owner of instance)
          try {
            await notifyGestor({ tenantId, instanceName: replyInstanceName, taskId, nextStatus, operatorName: null });
          } catch {
            // ignore
          }

          // confirmation message
          if (replyInstanceName && from) {
            const toDigits = String(from).replace(/\D+/g, '');
            const toNumber = toDigits ? `+${toDigits}` : String(from);

            const fmtDate = (d: any) => {
              if (!d) return null;
              try {
                const s = String(d);
                const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (m) return `${m[3]}/${m[2]}/${m[1]}`;
                const dt = new Date(s);
                if (Number.isNaN(dt.getTime())) return s;
                const dd = String(dt.getUTCDate()).padStart(2, '0');
                const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
                const yy = dt.getUTCFullYear();
                return `${dd}/${mm}/${yy}`;
              } catch {
                return String(d);
              }
            };

            const statusLabel =
              nextStatus === 'completed'
                ? 'Concluída'
                : nextStatus === 'in_progress'
                  ? 'Em andamento'
                  : nextStatus === 'awaiting_evidence'
                    ? 'Aguardando evidência'
                    : nextStatus;

            let title: string | null = null;
            let due: string | null = null;
            try {
              const { data: t } = await this.supabase.client
                .from('tasks')
                .select('title, due_date')
                .eq('tenant_id', tenantId)
                .eq('id', taskId)
                .maybeSingle();
              title = (t?.title as any) ?? null;
              due = fmtDate((t as any)?.due_date);
            } catch {
              // ignore
            }

            const shortId = String(taskId).split('-')[0];
            const verb = action === 'finish' ? 'concluí' : action === 'start' ? 'iniciei' : 'atualizei';

            try {
              await this.evolution.sendText(replyInstanceName, {
                to: toNumber,
                text: [
                  `✅ Pronto! Eu ${verb} a tarefa.`,
                  title ? `📌 ${title}` : null,
                  due ? `🗓 Prazo: ${due}` : null,
                  `📍 Status: ${statusLabel}`,
                  `🆔 ${shortId}`
                ]
                  .filter(Boolean)
                  .join('\n')
              });
            } catch {
              // ignore
            }
          }

          continue;
        }

        // 2) Text interpretation MVP (when buttons are not delivered/rendered)
        if (!text || typeof text !== 'string') continue;
        const msg = text.trim();
        if (!msg) continue;

        // Normalize inbound WA id/phone
        const fromDigits = String(from || '').replace(/\D+/g, '');

        // Find operator by wa_phone (suffix match; wa_phone is stored like +55...)
        const { data: op } = await this.supabase.client
          .from('operators')
          .select('id, wa_phone, name')
          .eq('tenant_id', tenantId)
          .limit(200);

        // normalize sender digits (remoteJid can be like 5541...@s.whatsapp.net)
        let senderDigits = fromDigits;
        if (senderDigits.endsWith('swhatsappnet')) {
          senderDigits = senderDigits.replace(/swhatsappnet$/, '');
        }

        const ops = op || [];

        const norm = (s: string) => String(s || '').replace(/\D+/g, '');
        const sender = norm(senderDigits);

        const findByTail = (tailLen: number) => {
          if (!sender) return null;
          const tail = sender.slice(-tailLen);
          const hits = ops.filter((o: any) => {
            const d = norm(o.wa_phone);
            return d && d.slice(-tailLen) === tail;
          });
          return hits.length === 1 ? hits[0] : null;
        };

        // Prefer strict match by last 13 (55 + DDD + 9 digits)
        let operator = findByTail(13);
        // Fallbacks (handle providers that omit a digit or formatting differences)
        if (!operator) operator = findByTail(12);
        if (!operator) operator = findByTail(11);
        if (!operator) operator = findByTail(9);
        if (!operator) operator = findByTail(8);


        // Resolve task id priority:
        // 1) explicit UUID in message
        // 2) WhatsApp "reply" threading (quoted message id -> our outbound message -> task_id)
        // 3) operator_state.current_task_id fallback
        const uuidMatch = msg.match(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/);
        let taskId: string | null = uuidMatch ? uuidMatch[0] : null;

        if (!taskId && replyToProviderMessageId) {
          const { data: quoted } = await this.supabase.client
            .from('wa_messages')
            .select('task_id')
            .eq('tenant_id', tenantId)
            .eq('direction', 'out')
            .eq('provider_message_id', replyToProviderMessageId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          taskId = (quoted?.task_id as any) ?? null;
        }

        if (!taskId && operator?.id) {
          const { data: st } = await this.supabase.client
            .from('operator_state')
            .select('current_task_id')
            .eq('tenant_id', tenantId)
            .eq('operator_id', operator.id)
            .maybeSingle();
          taskId = st?.current_task_id || null;
        }

        if (!taskId) {
          // cannot resolve task; log and optionally ask for ID
          try {
            await this.supabase.client.from('task_events').insert({
              tenant_id: tenantId,
              task_id: null,
              kind: 'wa.text.unmatched',
              data: { from, text: msg }
            });
          } catch {
            // ignore
          }

          if (replyInstanceName && from) {
            const toDigits = String(from).replace(/\D+/g, '');
            const toNumber = toDigits ? `+${toDigits}` : String(from);
            try {
              await this.evolution.sendText(replyInstanceName, {
                to: toNumber,
                text: 'Não consegui identificar qual tarefa você está falando. Pode responder com o ID da tarefa? (ex: feito <id>)'
              });
            } catch {
              // ignore
            }
          }

          continue;
        }

        const lower = msg.toLowerCase();

        // 2.5) Operator can ask for their task list (open / in progress / overdue)
        const wantsList = /(minhas\s+tarefas|listar\s+tarefas|lista\s+de\s+tarefas|tarefas\s+abertas|tarefas\s+em\s+andamento|tarefas\s+atrasadas|pendentes|abertas|atrasadas|em\s+andamento)/.test(lower);
        if (wantsList && replyInstanceName && from) {
          const toDigits = String(from).replace(/\D+/g, '');
          const toNumber = toDigits ? `+${toDigits}` : String(from);

          const isOverdueReq = /(atrasad)/.test(lower);
          const isInProgressReq = /(andamento|em\s+andamento|fazendo|executando)/.test(lower);
          const isOpenReq = /(abertas|pendentes|abertas|criad)/.test(lower);

          const needAll = /(todas|minhas\s+tarefas)/.test(lower) || (!isOverdueReq && !isInProgressReq && !isOpenReq);

          const statusesOpen = ['created', 'awaiting_evidence'];
          const statusesInProgress = ['in_progress'];

          const today = new Date();
          const yyyy = today.getUTCFullYear();
          const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(today.getUTCDate()).padStart(2, '0');
          const todayStr = `${yyyy}-${mm}-${dd}`;

          const fetchTasks = async (statuses: string[]) => {
            let q = this.supabase.client
              .from('tasks')
              .select('id, title, status, due_date, priority')
              .eq('tenant_id', tenantId)
              .eq('operator_id', operator?.id || '')
              .in('status', statuses)
              .order('due_date', { ascending: true, nullsFirst: false })
              .order('created_at', { ascending: false })
              .limit(10);

            const { data } = await q;
            return (data || []) as any[];
          };

          // overdue: due_date < today and not completed
          const fetchOverdue = async () => {
            const { data } = await this.supabase.client
              .from('tasks')
              .select('id, title, status, due_date, priority')
              .eq('tenant_id', tenantId)
              .eq('operator_id', operator?.id || '')
              .not('status', 'eq', 'completed')
              .not('due_date', 'is', null)
              .lt('due_date', todayStr)
              .order('due_date', { ascending: true })
              .limit(10);
            return (data || []) as any[];
          };

          const fmtDate = (d: any) => {
            if (!d) return null;
            const s = String(d);
            const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m) return `${m[3]}/${m[2]}`;
            return s;
          };

          const shortId = (id: string) => String(id).split('-')[0];
          const render = (t: any) => {
            const due = fmtDate(t.due_date);
            const dueTxt = due ? `🗓 ${due}` : '';
            return `• ${t.title} (${shortId(t.id)}) ${dueTxt}`.trim();
          };

          const sections: string[] = [];
          try {
            if (needAll || isOpenReq) {
              const open = await fetchTasks(statusesOpen);
              sections.push(`📋 *Abertas* (${open.length})`);
              sections.push(open.length ? open.map(render).join('\n') : '• Nenhuma');
              sections.push('');
            }
            if (needAll || isInProgressReq) {
              const prog = await fetchTasks(statusesInProgress);
              sections.push(`🏃 *Em andamento* (${prog.length})`);
              sections.push(prog.length ? prog.map(render).join('\n') : '• Nenhuma');
              sections.push('');
            }
            if (needAll || isOverdueReq) {
              const od = await fetchOverdue();
              sections.push(`⏰ *Atrasadas* (${od.length})`);
              sections.push(od.length ? od.map(render).join('\n') : '• Nenhuma');
              sections.push('');
            }

            sections.push('Responda com: *iniciar* | *foto* | *concluir* (ou *feito*)');

            await this.evolution.sendText(replyInstanceName, { to: toNumber, text: sections.join('\n') });

            await this.supabase.client.from('task_events').insert({
              tenant_id: tenantId,
              task_id: taskId,
              kind: 'wa.tasks.listed',
              data: { from, operatorId: operator?.id || null, text: msg }
            });
          } catch {
            // ignore
          }

          continue;
        }

        // Decide action by keywords
        const action =
          /(conclu[ií]|finaliz|feito|pronto|completei|concluido)/.test(lower)
            ? 'finish'
            : /(comecei|inici|iniciar|em andamento|fazendo|executando)/.test(lower)
              ? 'start'
              : /(foto|imagem|anexei|enviei foto|evid[êe]ncia)/.test(lower)
                ? 'photo'
                : null;

        const nextStatus =
          action === 'start'
            ? 'in_progress'
            : action === 'finish'
              ? 'completed'
              : action === 'photo'
                ? 'awaiting_evidence'
                : null;

        // If no recognized intent, just log as comment event
        if (!nextStatus) {
          await this.supabase.client.from('task_events').insert({
            tenant_id: tenantId,
            task_id: taskId,
            kind: 'wa.text.received',
            data: { from, text: msg, operatorId: operator?.id || null }
          });
          continue;
        }

        await this.supabase.client
          .from('tasks')
          .update({ status: nextStatus })
          .eq('tenant_id', tenantId)
          .eq('id', taskId);

        await this.supabase.client.from('task_events').insert({
          tenant_id: tenantId,
          task_id: taskId,
          kind: 'status.changed',
          data: {
            action,
            nextStatus,
            from,
            via: 'text',
            operatorId: operator?.id || null,
            text: msg
          }
        });

        // notify gestor (owner of instance)
        try {
          await notifyGestor({
            tenantId,
            instanceName: replyInstanceName,
            taskId,
            nextStatus,
            operatorName: (operator as any)?.name || null
          });
        } catch {
          // ignore
        }

        // confirmation message
        if (replyInstanceName && from) {
          const toDigits = String(from).replace(/\D+/g, '');
          const toNumber = toDigits ? `+${toDigits}` : String(from);

          const fmtDate = (d: any) => {
            if (!d) return null;
            try {
              const s = String(d);
              const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (m) return `${m[3]}/${m[2]}/${m[1]}`;
              const dt = new Date(s);
              if (Number.isNaN(dt.getTime())) return s;
              const dd = String(dt.getUTCDate()).padStart(2, '0');
              const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
              const yy = dt.getUTCFullYear();
              return `${dd}/${mm}/${yy}`;
            } catch {
              return String(d);
            }
          };

          const statusLabel =
            nextStatus === 'completed'
              ? 'Concluída'
              : nextStatus === 'in_progress'
                ? 'Em andamento'
                : nextStatus === 'awaiting_evidence'
                  ? 'Aguardando evidência'
                  : nextStatus;

          let title: string | null = null;
          let due: string | null = null;
          try {
            const { data: t } = await this.supabase.client
              .from('tasks')
              .select('title, due_date')
              .eq('tenant_id', tenantId)
              .eq('id', taskId)
              .maybeSingle();
            title = (t?.title as any) ?? null;
            due = fmtDate((t as any)?.due_date);
          } catch {
            // ignore
          }

          const shortId = String(taskId).split('-')[0];
          const verb = action === 'finish' ? 'concluí' : action === 'start' ? 'iniciei' : 'atualizei';

          try {
            await this.evolution.sendText(replyInstanceName, {
              to: toNumber,
              text: [
                `✅ Pronto! Eu ${verb} a tarefa.`,
                title ? `📌 ${title}` : null,
                due ? `🗓 Prazo: ${due}` : null,
                `📍 Status: ${statusLabel}`,
                `🆔 ${shortId}`
              ]
                .filter(Boolean)
                .join('\n')
            });

            await this.supabase.client.from('task_events').insert({
              tenant_id: tenantId,
              task_id: taskId,
              kind: 'wa.reply.sent',
              data: { to: toNumber, nextStatus, via: 'text' }
            });
          } catch {
            // ignore
          }
        }
      }
    });
  }
}
