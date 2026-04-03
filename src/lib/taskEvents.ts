import type { ApiTaskEvent } from './api';
import type { TaskActivity } from './types';

function apiStatusToLabel(status?: string) {
  switch (status) {
    case 'created':
    case 'awaiting_operator':
      return 'Pendente';
    case 'in_progress':
      return 'Em andamento';
    case 'awaiting_evidence':
      return 'Em revisão';
    case 'completed':
      return 'Concluída';
    default:
      return status || '';
  }
}

export function mapTaskEventToActivity(evt: ApiTaskEvent): TaskActivity {
  const kind = evt.kind;

  let type: TaskActivity['type'] = 'comment';
  let description = kind;

  if (kind === 'task.created') {
    type = 'created';
    description = 'Tarefa criada';
  } else if (kind === 'task.updated') {
    // if status changed, show which
    const status = evt.data?.status;
    const title = evt.data?.title;
    if (status) {
      type = 'status';
      description = `Status alterado para ${apiStatusToLabel(String(status))}`;
    } else if (title) {
      type = 'comment';
      description = 'Título atualizado';
    } else {
      type = 'comment';
      description = 'Tarefa atualizada';
    }
  } else if (kind === 'task.notify.enqueued') {
    type = 'comment';
    description = 'Notificação WhatsApp enfileirada';
  } else if (kind === 'wa.notified') {
    type = 'comment';
    description = 'Operador notificado no WhatsApp';
  } else if (kind === 'wa.reply.sent') {
    type = 'comment';
    description = 'Confirmação enviada ao operador';
  } else if (kind === 'wa.text.received') {
    type = 'comment';
    description = 'Mensagem recebida do operador';
  } else if (kind === 'status.changed') {
    type = 'status';
    const nextStatus = evt.data?.nextStatus;
    description = nextStatus ? `Status alterado para ${apiStatusToLabel(String(nextStatus))}` : 'Status alterado';
  }

  const actor = evt.actor_operator_id || evt.data?.operatorId || evt.data?.operator_id || undefined;

  return {
    id: evt.id,
    type,
    description,
    timestamp: evt.created_at,
    atorId: actor
  };
}
