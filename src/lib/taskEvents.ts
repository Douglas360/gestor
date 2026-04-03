import type { ApiTaskEvent } from './api';
import type { TaskActivity } from './types';

export function mapTaskEventToActivity(evt: ApiTaskEvent): TaskActivity {
  const kind = evt.kind;

  let type: TaskActivity['type'] = 'comment';
  let description = kind;

  if (kind === 'task.created') {
    type = 'created';
    description = 'Tarefa criada';
  } else if (kind === 'task.updated') {
    type = 'comment';
    description = 'Tarefa atualizada';
  } else if (kind === 'task.notify.enqueued') {
    type = 'comment';
    description = 'Notificação WhatsApp enfileirada';
  } else if (kind === 'wa.notified') {
    type = 'comment';
    description = 'Operador notificado no WhatsApp';
  } else if (kind === 'status.changed') {
    type = 'status';
    const nextStatus = evt.data?.nextStatus;
    description = nextStatus ? `Status alterado para ${nextStatus}` : 'Status alterado';
  }

  return {
    id: evt.id,
    type,
    description,
    timestamp: evt.created_at,
    atorId: evt.actor_operator_id || undefined
  };
}
