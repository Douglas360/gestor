import { Operador, Task } from "./types";

export const OPERADORES_MOCK: Operador[] = [
  {
    id: "op1",
    nome: "Ana Silva",
    email: "ana.silva@editorial.com",
    whatsapp: "(11) 99872-4412",
    cargo: "Operador Nível 3",
    status: "ativo",
    initials: "AS",
  },
  {
    id: "op2",
    nome: "Marcos Oliveira",
    email: "m.oliveira@editorial.com",
    whatsapp: "(11) 91234-5678",
    cargo: "Operador Nível 1",
    status: "ativo",
    initials: "MO",
  },
  {
    id: "op3",
    nome: "Bruno Campos",
    email: "bruno.c@editorial.com",
    whatsapp: "(21) 98821-3310",
    cargo: "Operador Nível 2",
    status: "inativo",
    initials: "BC",
  },
  {
    id: "op4",
    nome: "Carla Dias",
    email: "c.dias@editorial.com",
    whatsapp: "(11) 97711-2290",
    cargo: "Operador Nível 2",
    status: "ativo",
    initials: "CD",
  },
  {
    id: "op5",
    nome: "Mariana Costa",
    email: "mariana.c@editorial.com",
    whatsapp: "(11) 98773-5501",
    cargo: "Operador Nível 3",
    status: "ativo",
    initials: "MC",
  },
];

export const TASKS_MOCK: Task[] = [
  {
    id: "t1",
    titulo: "Planejar Viagem de Pesquisa Editorial",
    descricao:
      "Definir roteiro completo para a viagem de cobertura jornalística prevista para o mês de abril.",
    status: "em_andamento",
    prioridade: "urgente",
    dataVencimento: "2026-04-02",
    responsavelId: "op1",
    tags: ["Urgente", "Viagem"],
    subtarefas: [
      { id: "s1", label: "Reservar passagens aéreas", done: true },
      { id: "s2", label: "Confirmar reserva no hotel", done: true },
      { id: "s3", label: "Definir pautas das entrevistas", done: false },
      { id: "s4", label: "Organizar equipamentos de áudio", done: false },
    ],
    lembrete: "Amanhã às 09:00",
    criadaEm: "2026-03-28",
    concluida: false,
    activities: [
      { id: "a1", type: "created", description: "Tarefa criada", timestamp: "2026-03-28T08:00:00Z" },
      { id: "a2", type: "status", description: "Status alterado para Em Andamento", timestamp: "2026-03-29T10:30:00Z" }
    ]
  },
  {
    id: "t2",
    titulo: "Revisar Relatório Mensal de Performance",
    descricao: "Análise de métricas de março para apresentação à diretoria.",
    status: "pendente",
    prioridade: "alta",
    dataVencimento: "2026-04-01",
    responsavelId: "op2",
    tags: ["Financeiro"],
    subtarefas: [
      { id: "s5", label: "Coletar dados de analytics", done: false },
      { id: "s6", label: "Montar apresentação slides", done: false },
    ],
    criadaEm: "2026-03-29",
    concluida: false,
    activities: [
      { id: "a3", type: "created", description: "Tarefa criada", timestamp: "2026-03-29T14:15:00Z" }
    ]
  },
  {
    id: "t3",
    titulo: "Reunião de Alinhamento de Pauta",
    descricao: "Alinhamento semanal com toda a equipe editorial.",
    status: "pendente",
    prioridade: "media",
    dataVencimento: "2026-04-03",
    responsavelId: "op4",
    tags: [],
    subtarefas: [],
    criadaEm: "2026-03-30",
    concluida: false,
    activities: [
      { id: "a4", type: "created", description: "Tarefa criada", timestamp: "2026-03-30T09:00:00Z" }
    ]
  },
  {
    id: "t4",
    titulo: "Auditoria de Qualidade Q4",
    descricao: "Revisão completa do processo de publicação e indicadores de qualidade.",
    status: "pendente",
    prioridade: "baixa",
    dataVencimento: "2026-04-15",
    responsavelId: "op3",
    tags: [],
    subtarefas: [
      { id: "s7", label: "Mapear fluxo atual", done: false },
      { id: "s8", label: "Identificar gargalos", done: false },
      { id: "s9", label: "Gerar relatório final", done: false },
    ],
    criadaEm: "2026-03-31",
    concluida: false,
    activities: [
      { id: "a5", type: "created", description: "Tarefa criada", timestamp: "2026-03-31T11:20:00Z" }
    ]
  },
  {
    id: "t5",
    titulo: "Gravação: Podcast #42 - Futuro da IA",
    descricao:
      "Gravação do episódio principal com foco nas novas tendências de IA Generativa aplicada ao mercado editorial.",
    status: "em_revisao",
    prioridade: "alta",
    dataVencimento: "2026-03-14",
    responsavelId: "op5",
    tags: ["Podcast", "Produção"],
    subtarefas: [
      { id: "s10", label: "Validar pauta com convidado", done: true },
      { id: "s11", label: "Configurar estúdio e mics", done: false },
      { id: "s12", label: "Realizar gravação (2h)", done: false },
    ],
    criadaEm: "2026-03-10",
    concluida: false,
    activities: [
      { id: "a6", type: "created", description: "Tarefa criada", timestamp: "2026-03-10T16:45:00Z" },
      { id: "a7", type: "status", description: "Status alterado para Em Revisão", timestamp: "2026-03-12T18:00:00Z", atorId: "op5" }
    ]
  },
];

export const TAGS_SUGERIDAS = [
  "Urgente",
  "Financeiro",
  "Viagem",
  "Podcast",
  "Produção",
  "Editorial",
  "Reunião",
  "Campanha",
  "Relatório",
  "Marketing",
];
