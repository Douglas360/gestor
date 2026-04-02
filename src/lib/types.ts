export type Priority = "urgente" | "alta" | "media" | "baixa";
export type Status = "pendente" | "em_andamento" | "em_revisao" | "concluida";

export type Operador = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  cargo: string;
  status: "ativo" | "inativo";
  initials: string;
  avatar?: string;
};

export type Subtarefa = {
  id: string;
  label: string;
  done: boolean;
};

export type TaskActivity = {
  id: string;
  type: "created" | "status" | "responsavel" | "concluida" | "comment";
  description: string;
  timestamp: string; // ISO date string
  atorId?: string; // operator who made the change
};

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  status: Status;
  prioridade: Priority;
  dataVencimento?: string; // ISO date string
  responsavelId?: string;
  tags: string[];
  subtarefas: Subtarefa[];
  lembrete?: string;
  criadaEm: string;
  concluida: boolean;
  activities: TaskActivity[];
};
