import type { Operador, Priority, Task, Status } from './types';
import type { ApiOperator, ApiTask } from './api';

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function mapApiOperator(op: ApiOperator): Operador {
  return {
    id: op.id,
    nome: op.name,
    email: op.email || '',
    whatsapp: op.wa_phone,
    cargo: op.role || 'Operador',
    status: op.active ? 'ativo' : 'inativo',
    initials: initialsFromName(op.name),
    avatar: op.avatar_url || undefined
  };
}

export function mapStatusFromApi(status: string): Status {
  switch (status) {
    case 'completed':
      return 'concluida';
    case 'in_progress':
      return 'em_andamento';
    case 'awaiting_evidence':
      return 'em_revisao';
    case 'created':
    case 'awaiting_operator':
    default:
      return 'pendente';
  }
}

export function mapStatusToApi(status: Status): ApiTask['status'] {
  switch (status) {
    case 'concluida':
      return 'completed';
    case 'em_andamento':
      return 'in_progress';
    case 'em_revisao':
      return 'awaiting_evidence';
    case 'pendente':
    default:
      return 'created';
  }
}

function mapPriorityFromApi(priority?: string | null): Priority {
  switch (priority) {
    case 'urgente':
    case 'alta':
    case 'media':
    case 'baixa':
      return priority;
    default:
      return 'media';
  }
}

export function mapApiTask(task: ApiTask): Task {
  const status = mapStatusFromApi(task.status);

  return {
    id: task.id,
    titulo: task.title,
    descricao: task.description || undefined,
    status,
    prioridade: mapPriorityFromApi(task.priority),
    dataVencimento: task.due_date || undefined,
    responsavelId: task.operator_id || undefined,
    tags: Array.isArray(task.tags) ? task.tags : [],
    subtarefas: Array.isArray(task.subtasks) ? task.subtasks : [],
    lembrete: task.reminder || undefined,
    criadaEm: task.created_at?.split('T')?.[0] || new Date().toISOString().split('T')[0],
    concluida: status === 'concluida',
    activities: []
  };
}
