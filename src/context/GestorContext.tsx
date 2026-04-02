"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Task, Operador, Status, Priority, Subtarefa } from "@/lib/types";
import { TASKS_MOCK, OPERADORES_MOCK } from "@/lib/mockData";

// ─── Types ───────────────────────────────────────────────────────────────────

type NewTaskInput = {
  titulo: string;
  descricao?: string;
  prioridade: Priority;
  status: Status;
  dataVencimento?: string;
  responsavelId?: string;
  tags: string[];
};

type NewOperadorInput = {
  nome: string;
  email: string;
  whatsapp: string;
  cargo: string;
  avatar?: string;
};

type GestorContextType = {
  // State
  tasks: Task[];
  operadores: Operador[];
  selectedTaskId: string | null;
  isNewTaskModalOpen: boolean;
  isNewOperadorModalOpen: boolean;

  // Computed
  selectedTask: Task | undefined;
  getOperador: (id?: string) => Operador | undefined;

  // Actions
  selectTask: (id: string | null) => void;
  openNewTaskModal: () => void;
  closeNewTaskModal: () => void;
  createTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleSubtarefa: (taskId: string, subtarefaId: string) => void;
  addSubtarefa: (taskId: string, label: string) => void;
  toggleConcluida: (taskId: string) => void;
  changeStatus: (taskId: string, status: Status) => void;
  changeResponsavel: (taskId: string, responsavelId: string | undefined) => void;
  addTag: (taskId: string, tag: string) => void;
  removeTag: (taskId: string, tag: string) => void;

  // Operadores
  openNewOperadorModal: () => void;
  closeNewOperadorModal: () => void;
  createOperador: (input: NewOperadorInput) => Operador;
  updateOperador: (id: string, patch: Partial<Operador>) => void;
  deleteOperador: (id: string) => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const GestorContext = createContext<GestorContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function GestorProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(TASKS_MOCK);
  const [operadores, setOperadores] = useState<Operador[]>(OPERADORES_MOCK);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("t1");
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewOperadorModalOpen, setIsNewOperadorModalOpen] = useState(false);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const getOperador = useCallback(
    (id?: string) => operadores.find((o) => o.id === id),
    [operadores]
  );

  const selectTask = useCallback((id: string | null) => {
    setSelectedTaskId(id);
  }, []);

  const openNewTaskModal = useCallback(() => setIsNewTaskModalOpen(true), []);
  const closeNewTaskModal = useCallback(() => setIsNewTaskModalOpen(false), []);

  const openNewOperadorModal = useCallback(() => setIsNewOperadorModalOpen(true), []);
  const closeNewOperadorModal = useCallback(() => setIsNewOperadorModalOpen(false), []);

  const createOperador = useCallback((input: NewOperadorInput): Operador => {
    const names = input.nome.trim().split(" ");
    const initials = names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : (names[0]?.[0] || "?").toUpperCase();

    const newOp: Operador = {
      id: `op_${Date.now()}`,
      nome: input.nome,
      email: input.email,
      whatsapp: input.whatsapp,
      cargo: input.cargo,
      status: "ativo",
      initials,
      avatar: input.avatar,
    };
    setOperadores((prev) => [...prev, newOp]);
    return newOp;
  }, []);

  const updateOperador = useCallback((id: string, patch: Partial<Operador>) => {
    setOperadores((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const deleteOperador = useCallback((id: string) => {
    setOperadores((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const createTask = useCallback((input: NewTaskInput): Task => {
    const dataAtual = new Date().toISOString();
    const newTask: Task = {
      id: `t${Date.now()}`,
      titulo: input.titulo,
      descricao: input.descricao,
      status: input.status,
      prioridade: input.prioridade,
      dataVencimento: input.dataVencimento,
      responsavelId: input.responsavelId,
      tags: input.tags,
      subtarefas: [],
      criadaEm: dataAtual.split("T")[0],
      concluida: false,
      activities: [
        {
          id: `a${Date.now()}`,
          type: "created",
          description: "Tarefa criada",
          timestamp: dataAtual,
        }
      ]
    };
    setTasks((prev) => [newTask, ...prev]);
    setSelectedTaskId(newTask.id);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const toggleSubtarefa = useCallback((taskId: string, subtarefaId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtarefas: t.subtarefas.map((s) =>
                s.id === subtarefaId ? { ...s, done: !s.done } : s
              ),
            }
          : t
      )
    );
  }, []);

  const addSubtarefa = useCallback((taskId: string, label: string) => {
    const nova: Subtarefa = { id: `s${Date.now()}`, label, done: false };
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtarefas: [...t.subtarefas, nova] } : t
      )
    );
  }, []);

  const toggleConcluida = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isConcluida = !t.concluida;
          return {
            ...t,
            concluida: isConcluida,
            status: isConcluida ? "concluida" : "pendente",
            activities: [
              {
                id: `a${Date.now()}`,
                type: "concluida",
                description: isConcluida ? "Tarefa concluída" : "Tarefa reaberta",
                timestamp: new Date().toISOString(),
              },
              ...t.activities,
            ]
          };
        }
        return t;
      })
    );
  }, []);

  const changeStatus = useCallback((taskId: string, status: Status) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.status !== status) {
          return {
            ...t,
            status,
            activities: [
              {
                id: `a${Date.now()}`,
                type: "status",
                description: `Status alterado para ${status.replace("_", " ")}`,
                timestamp: new Date().toISOString(),
              },
              ...t.activities,
            ]
          };
        }
        return t;
      })
    );
  }, []);

  const changeResponsavel = useCallback(
    (taskId: string, responsavelId: string | undefined) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId && t.responsavelId !== responsavelId) {
            return {
              ...t,
              responsavelId,
              activities: [
                {
                  id: `a${Date.now()}`,
                  type: "responsavel",
                  description: responsavelId ? "Responsável alterado" : "Responsável removido",
                  timestamp: new Date().toISOString(),
                  atorId: responsavelId,
                },
                ...t.activities,
              ]
            }
          }
          return t;
        })
      );
    },
    []
  );

  const addTag = useCallback((taskId: string, tag: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId && !t.tags.includes(tag) ? { ...t, tags: [...t.tags, tag] } : t
      )
    );
  }, []);

  const removeTag = useCallback((taskId: string, tag: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, tags: t.tags.filter((tg) => tg !== tag) } : t
      )
    );
  }, []);

  return (
    <GestorContext.Provider
      value={{
        tasks,
        operadores,
        selectedTaskId,
        isNewTaskModalOpen,
        isNewOperadorModalOpen,
        selectedTask,
        getOperador,
        selectTask,
        openNewTaskModal,
        closeNewTaskModal,
        openNewOperadorModal,
        closeNewOperadorModal,
        createOperador,
        updateOperador,
        deleteOperador,
        createTask,
        updateTask,
        toggleSubtarefa,
        addSubtarefa,
        toggleConcluida,
        changeStatus,
        changeResponsavel,
        addTag,
        removeTag,
      }}
    >
      {children}
    </GestorContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGestor(): GestorContextType {
  const ctx = useContext(GestorContext);
  if (!ctx) throw new Error("useGestor must be used within GestorProvider");
  return ctx;
}
