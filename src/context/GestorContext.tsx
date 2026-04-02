"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Task, Operador, Status, Priority, Subtarefa } from "@/lib/types";
import * as api from "@/lib/api";

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
  isLoading: boolean;
  lastError: string | null;

  // Computed
  selectedTask: Task | undefined;
  getOperador: (id?: string) => Operador | undefined;

  // Actions
  selectTask: (id: string | null) => void;
  openNewTaskModal: () => void;
  closeNewTaskModal: () => void;
  reloadAll: () => Promise<void>;
  createTask: (input: NewTaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  notifyTask: (id: string) => Promise<void>;

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
  createOperador: (input: NewOperadorInput) => Promise<Operador>;
  updateOperador: (id: string, patch: Partial<Operador>) => Promise<void>;
  deleteOperador: (id: string) => Promise<void>;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const GestorContext = createContext<GestorContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function GestorProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewOperadorModalOpen, setIsNewOperadorModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

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

  const reloadAll = useCallback(async () => {
    setIsLoading(true);
    setLastError(null);
    try {
      const [ops, ts] = await Promise.all([api.listOperators(), api.listTasks()]);
      const { mapApiOperator, mapApiTask } = await import("@/lib/mappers");

      const mappedOps = ops.data.map(mapApiOperator);
      const mappedTasks = ts.data.map(mapApiTask);

      setOperadores(mappedOps);
      setTasks(mappedTasks);

      if (!selectedTaskId && mappedTasks.length > 0) setSelectedTaskId(mappedTasks[0]!.id);
    } catch (e: any) {
      setLastError(e?.message || String(e));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  const createOperador = useCallback(async (input: NewOperadorInput): Promise<Operador> => {
    const { mapApiOperator } = await import("@/lib/mappers");
    const created = await api.createOperator({
      name: input.nome,
      wa_phone: input.whatsapp,
      active: true,
      email: input.email || null,
      role: input.cargo || null,
      avatar_url: input.avatar || null,
    });
    const mapped = mapApiOperator(created);
    setOperadores((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const updateOperador = useCallback(async (id: string, patch: Partial<Operador>) => {
    setOperadores((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

    await api.updateOperator(id, {
      name: patch.nome,
      wa_phone: patch.whatsapp,
      active: patch.status ? patch.status === "ativo" : undefined,
      email: patch.email ?? undefined,
      role: patch.cargo ?? undefined,
      avatar_url: patch.avatar ?? undefined,
    } as any);
  }, []);

  const deleteOperador = useCallback(async (id: string) => {
    setOperadores((prev) => prev.filter((o) => o.id !== id));
    await api.deleteOperator(id);
  }, []);

  const createTask = useCallback(async (input: NewTaskInput): Promise<Task> => {
    const { mapApiTask, mapStatusToApi } = await import("@/lib/mappers");

    const created = await api.createTask({
      title: input.titulo,
      description: input.descricao ?? null,
      status: mapStatusToApi(input.status),
      operator_id: input.responsavelId || null,
      priority: input.prioridade,
      due_date: input.dataVencimento || null,
      tags: input.tags || [],
      subtasks: [],
      reminder: null,
    });

    const mapped = mapApiTask(created);
    setTasks((prev) => [mapped, ...prev]);
    setSelectedTaskId(mapped.id);
    return mapped;
  }, []);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

    const { mapStatusToApi } = await import("@/lib/mappers");
    await api.updateTask(id, {
      title: patch.titulo,
      description: patch.descricao ?? undefined,
      status: patch.status ? mapStatusToApi(patch.status) : undefined,
      operator_id: patch.responsavelId ?? undefined,
      priority: patch.prioridade ?? undefined,
      due_date: patch.dataVencimento ?? undefined,
      tags: patch.tags ?? undefined,
      subtasks: patch.subtarefas ?? undefined,
      reminder: patch.lembrete ?? undefined,
    } as any);
  }, []);

  const notifyTask = useCallback(async (id: string) => {
    await api.notifyTask(id);
  }, []);

  // Subtasks/tags now persist in Supabase (tasks.subtasks / tasks.tags)
  const toggleSubtarefa = useCallback(
    (taskId: string, subtarefaId: string) => {
      const t = tasks.find((x) => x.id === taskId);
      if (!t) return;
      const next = t.subtarefas.map((s) => (s.id === subtarefaId ? { ...s, done: !s.done } : s));
      void updateTask(taskId, { subtarefas: next });
    },
    [tasks, updateTask]
  );

  const addSubtarefa = useCallback(
    (taskId: string, label: string) => {
      const t = tasks.find((x) => x.id === taskId);
      if (!t) return;
      const nova: Subtarefa = { id: `s${Date.now()}`, label, done: false };
      const next = [...t.subtarefas, nova];
      void updateTask(taskId, { subtarefas: next });
    },
    [tasks, updateTask]
  );

  const toggleConcluida = useCallback(
    (taskId: string) => {
      void updateTask(taskId, { concluida: true, status: "concluida" });
    },
    [updateTask]
  );

  const changeStatus = useCallback(
    (taskId: string, status: Status) => {
      void updateTask(taskId, { status });
    },
    [updateTask]
  );

  const changeResponsavel = useCallback(
    (taskId: string, responsavelId: string | undefined) => {
      void updateTask(taskId, { responsavelId });
    },
    [updateTask]
  );

  const addTag = useCallback(
    (taskId: string, tag: string) => {
      const t = tasks.find((x) => x.id === taskId);
      if (!t) return;
      const trimmed = tag.trim();
      if (!trimmed) return;
      const next = t.tags.includes(trimmed) ? t.tags : [...t.tags, trimmed];
      void updateTask(taskId, { tags: next });
    },
    [tasks, updateTask]
  );

  const removeTag = useCallback(
    (taskId: string, tag: string) => {
      const t = tasks.find((x) => x.id === taskId);
      if (!t) return;
      const next = t.tags.filter((tg) => tg !== tag);
      void updateTask(taskId, { tags: next });
    },
    [tasks, updateTask]
  );

  return (
    <GestorContext.Provider
      value={{
        tasks,
        operadores,
        selectedTaskId,
        isNewTaskModalOpen,
        isNewOperadorModalOpen,
        isLoading,
        lastError,
        selectedTask,
        getOperador,
        selectTask,
        openNewTaskModal,
        closeNewTaskModal,
        reloadAll,
        createTask,
        updateTask,
        notifyTask,
        toggleSubtarefa,
        addSubtarefa,
        toggleConcluida,
        changeStatus,
        changeResponsavel,
        addTag,
        removeTag,
        openNewOperadorModal,
        closeNewOperadorModal,
        createOperador,
        updateOperador,
        deleteOperador,
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
