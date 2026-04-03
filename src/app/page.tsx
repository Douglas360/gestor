"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useGestor } from "@/context/GestorContext";
import { Task } from "@/lib/types";
import * as api from "@/lib/api";
import { mapTaskEventToActivity } from "@/lib/taskEvents";

export default function DashboardPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [activities, setActivities] = useState<import("@/lib/types").TaskActivity[]>([]);

  const {
    tasks,
    getOperador,
    selectedTaskId,
    selectTask,
    selectedTask,
    toggleConcluida,
    changeStatus,
    updateTask,
    deleteTask,
    toggleSubtarefa,
    reloadAll,
  } = useGestor();

  useEffect(() => {
    setMounted(true);
  }, []);

  // allow navigation back from /tarefas/nova selecting the created task
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('selected');
    if (id) selectTask(id);
  }, [mounted, selectTask]);

  useEffect(() => {
    if (!selectedTask) {
      setActivities([]);
      return;
    }

    let cancelled = false;
    let lastTopEventId: string | null = null;

    const load = async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setEventsLoading(true);
        setEventsError(null);
      }

      try {
        const res = await api.listTaskEvents(selectedTask.id);
        const evts = res.data || [];
        if (cancelled) return;

        setActivities(evts.map(mapTaskEventToActivity));

        const topId = evts[0]?.id || null;
        if (topId && topId !== lastTopEventId) {
          lastTopEventId = topId;
          await reloadAll();
        }
      } catch (e: any) {
        if (!cancelled) setEventsError(e?.message || String(e));
      } finally {
        if (!cancelled && !opts?.silent) setEventsLoading(false);
      }
    };

    void load();

    const timer = setInterval(() => {
      void load({ silent: true });
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedTask?.id, reloadAll]);

  // Grouping tasks roughly by "hoje", "amanha", "proximos" (for UI sake)
  // To avoid hydration mismatch, we depend on these computations only when mounted
  const todayStr = mounted ? new Date().toISOString().split("T")[0] : "";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = mounted ? tomorrow.toISOString().split("T")[0] : "";

  const tasksHoje = tasks.filter(
    (t) => !t.concluida && (t.dataVencimento === todayStr || (t.dataVencimento && t.dataVencimento < todayStr))
  );
  const tasksAmanha = tasks.filter(
    (t) => !t.concluida && t.dataVencimento === tomorrowStr
  );
  const tasksProximos = tasks.filter(
    (t) =>
      !t.concluida &&
      t.dataVencimento !== todayStr &&
      t.dataVencimento !== tomorrowStr &&
      (!t.dataVencimento || t.dataVencimento > todayStr)
  );

  const getAvatarFallback = (responsavelId?: string) => {
    if (!responsavelId) return "?";
    const op = getOperador(responsavelId);
    return op?.initials || "?";
  };

  const getStatusMeta = (status: import("@/lib/types").Status) => {
    switch (status) {
      case "pendente":
        return { label: "Pendente", dot: "bg-secondary/60", pill: "bg-surface-container-highest text-secondary border-outline-variant/20" };
      case "em_andamento":
        return { label: "Em andamento", dot: "bg-sky-400", pill: "bg-sky-900/20 text-sky-300 border-sky-900/40" };
      case "em_revisao":
        return { label: "Em revisão", dot: "bg-yellow-400", pill: "bg-yellow-900/20 text-yellow-300 border-yellow-900/40" };
      case "concluida":
        return { label: "Concluída", dot: "bg-primary", pill: "bg-primary/10 text-primary border-primary/20" };
      default:
        return { label: status, dot: "bg-secondary/60", pill: "bg-surface-container-highest text-secondary border-outline-variant/20" };
    }
  };

  const renderTask = (task: Task) => {
    const isSelected = selectedTaskId === task.id;
    return (
      <div
        key={task.id}
        onClick={() => selectTask(task.id)}
        className={`group flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer border-l-4 ${
          isSelected
            ? "bg-surface-container-highest border-primary"
            : "bg-surface-container-low hover:bg-surface-container-high border-transparent"
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleConcluida(task.id);
            }}
            className={`material-symbols-outlined transition-colors ${
              task.concluida ? "text-primary" : "text-secondary hover:text-primary"
            }`}
            style={task.concluida ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {task.concluida ? "check_circle" : "radio_button_unchecked"}
          </button>
          <span
            className={`font-medium ${
              task.concluida ? "line-through text-secondary" : "text-on-surface"
            }`}
          >
            {task.titulo}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <span
            className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter border ${getStatusMeta(task.status).pill}`}
            title={getStatusMeta(task.status).label}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${getStatusMeta(task.status).dot}`} />
            {getStatusMeta(task.status).label}
          </span>

          {task.prioridade === "urgente" && (
            <span className="text-[10px] bg-error-container/20 text-error-dim px-2 py-0.5 rounded uppercase font-bold tracking-tighter">
              Urgente
            </span>
          )}
          {task.prioridade === "alta" && (
            <span className="text-[10px] bg-orange-900/20 text-orange-400 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">
              Alta
            </span>
          )}
          {task.tags[0] && task.prioridade !== "urgente" && task.prioridade !== "alta" && (
            <span className="text-[10px] bg-surface-container-highest text-secondary px-2 py-0.5 rounded uppercase font-bold tracking-tighter">
              {task.tags[0]}
            </span>
          )}
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold border border-outline-variant/30">
            {getAvatarFallback(task.responsavelId)}
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="ml-64 flex h-screen overflow-hidden flex-1">
        {/* Center Column: Task List */}
        <section className="flex-1 flex flex-col bg-background border-r border-outline-variant/10 relative">
          <TopBar activeTab="" searchPlaceholder="Buscar tarefas..." />

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 pb-32">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-on-surface">
                  Todas as tarefas
                </h2>
                <button
                  onClick={() => router.push('/tarefas/nova')}
                  className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm tracking-tight transition-transform active:scale-95 flex items-center gap-2 shadow-lg"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Nova Tarefa
                </button>
              </div>

              {/* Hoje */}
              {tasksHoje.length > 0 && (
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      calendar_today
                    </span>
                    Hoje / Atrasadas
                  </div>
                  <div className="space-y-1.5">{tasksHoje.map(renderTask)}</div>
                </div>
              )}

              {/* Amanhã */}
              {tasksAmanha.length > 0 && (
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2 text-secondary font-semibold text-sm uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">event</span>
                    Amanhã
                  </div>
                  <div className="space-y-1.5">{tasksAmanha.map(renderTask)}</div>
                </div>
              )}

              {/* Próximos */}
              {tasksProximos.length > 0 && (
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2 text-secondary font-semibold text-sm uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">upcoming</span>
                    Próximos
                  </div>
                  <div className="space-y-1.5 opacity-80">{tasksProximos.map(renderTask)}</div>
                </div>
              )}
              
              {/* Concluídas */}
              {tasks.filter(t => t.concluida).length > 0 && (
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2 text-secondary/60 font-semibold text-sm uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">task_alt</span>
                    Concluídas
                  </div>
                  <div className="space-y-1.5 opacity-50">{tasks.filter(t => t.concluida).map(renderTask)}</div>
                </div>
              )}
              
              {tasks.length === 0 && (
                <div className="text-center py-20 text-secondary">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">task</span>
                  <p>Nenhuma tarefa encontrada.</p>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Input Bottom (optional, replaced its action to just open modal for consistency) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
            <div className="max-w-4xl mx-auto flex items-center gap-4 bg-surface-container-highest p-1.5 rounded-2xl shadow-2xl border border-outline-variant/10 pointer-events-auto">
              <span className="material-symbols-outlined text-primary ml-4">add_circle</span>
              <button
                onClick={() => router.push('/tarefas/nova')}
                className="flex-1 text-left bg-transparent border-none text-secondary/50 py-3 outline-none hover:text-secondary transition-colors"
              >
                Escreva uma nova tarefa...
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Task Details */}
        <section className="w-[400px] bg-surface-container-low flex flex-col p-8 overflow-y-auto">
          {!selectedTask ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary opacity-50 text-center">
              <span className="material-symbols-outlined text-5xl mb-4">swipe_left</span>
              <p>Selecione uma tarefa para ver os detalhes</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full uppercase border ${getStatusMeta(selectedTask.status).pill}`}
                >
                  <span className={`w-2 h-2 rounded-full ${getStatusMeta(selectedTask.status).dot} ${selectedTask.status !== "concluida" ? "animate-pulse" : ""}`} />
                  {getStatusMeta(selectedTask.status).label}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!selectedTask) return;
                      const ok = window.confirm(`Excluir a tarefa "${selectedTask.titulo}"? Essa ação não pode ser desfeita.`);
                      if (!ok) return;
                      void deleteTask(selectedTask.id);
                    }}
                    className="material-symbols-outlined text-secondary hover:text-error-dim transition-colors"
                    title="Excluir tarefa"
                  >
                    delete
                  </button>
                  <button className="material-symbols-outlined text-secondary hover:text-on-surface transition-colors">
                    share
                  </button>
                  <button className="material-symbols-outlined text-secondary hover:text-on-surface transition-colors">
                    more_vert
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-on-surface leading-tight mb-8">
                {selectedTask.titulo}
              </h3>

              <div className="space-y-6">
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                    Status
                  </label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => changeStatus(selectedTask.id, e.target.value as any)}
                    className="w-full bg-surface-container-highest p-3 rounded-lg text-sm font-medium text-on-surface outline-none cursor-pointer focus:ring-1 focus:ring-primary/30 [color-scheme:dark]"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="em_revisao">Em Revisão</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>

                {/* Responsável */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                    Responsável
                  </label>
                  <div className="flex items-center gap-3 bg-surface-container-highest p-3 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                      {getAvatarFallback(selectedTask.responsavelId)}
                    </div>
                    <span className="text-sm font-medium">
                      {getOperador(selectedTask.responsavelId)?.nome || "Não atribuído"}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.prioridade !== "media" && selectedTask.prioridade !== "baixa" && (
                      <span className="bg-error/10 text-error-dim px-3 py-1 rounded-full text-[11px] font-bold border border-error/20 uppercase">
                        {selectedTask.prioridade}
                      </span>
                    )}
                    {selectedTask.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vencimento */}
                {selectedTask.dataVencimento && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                      Data de Vencimento
                    </label>
                    <div className="flex items-center gap-3 text-sm bg-surface-container-highest/50 p-3 rounded-lg border border-outline-variant/10">
                      <span className="material-symbols-outlined text-primary text-lg">event</span>
                      <span className="text-on-surface">
                        {new Date(selectedTask.dataVencimento).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                    Descrição
                  </label>
                  <textarea
                    value={selectedTask.descricao || ""}
                    onChange={(e) => updateTask(selectedTask.id, { descricao: e.target.value })}
                    className="w-full bg-surface-container-highest/30 border border-outline-variant/10 rounded-xl p-4 text-sm text-on-surface placeholder:text-secondary/30 focus:ring-1 focus:ring-primary/30 resize-none h-28 outline-none"
                    placeholder="Adicione detalhes ou notas..."
                  />
                </div>

                {/* Subtarefas */}
                {selectedTask.subtarefas.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                        Subtarefas
                      </label>
                      <span className="text-[10px] font-bold text-primary">
                        {selectedTask.subtarefas.filter(s => s.done).length}/{selectedTask.subtarefas.length} concluídas
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedTask.subtarefas.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => toggleSubtarefa(selectedTask.id, sub.id)}
                          className="flex items-center gap-3 text-sm p-2 hover:bg-surface-container-highest/50 rounded-lg transition-colors cursor-pointer group"
                        >
                          <span
                            className={`material-symbols-outlined ${
                              sub.done ? "text-primary" : "text-secondary hover:text-primary"
                            }`}
                            style={sub.done ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {sub.done ? "check_circle" : "radio_button_unchecked"}
                          </span>
                          <span
                            className={sub.done ? "line-through text-secondary" : "text-on-surface"}
                          >
                            {sub.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Activity History */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-secondary">history</span>
                  <h4 className="text-sm font-bold text-on-surface">Histórico</h4>
                </div>

                {eventsLoading && (
                  <div className="text-sm text-secondary">Carregando histórico...</div>
                )}

                {eventsError && (
                  <div className="text-sm text-error-dim">{eventsError}</div>
                )}

                {!eventsLoading && !eventsError && activities.length === 0 && (
                  <div className="text-sm text-secondary">Sem eventos ainda.</div>
                )}

                {!eventsLoading && !eventsError && activities.length > 0 && (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:w-0.5 before:bg-outline-variant/10">
                    {activities.map((activity) => {
                      // pick icon based on type
                      let icon = "info";
                      let colorClass = "text-secondary";
                      let bgClass = "bg-surface-container-highest";
                      if (activity.type === "created") {
                        icon = "add_box";
                        colorClass = "text-primary";
                        bgClass = "bg-primary/10";
                      } else if (activity.type === "concluida") {
                        icon = "check_circle";
                        colorClass = "text-primary";
                        bgClass = "bg-primary/10";
                      } else if (activity.type === "status") {
                        icon = "sync";
                        colorClass = "text-secondary";
                        bgClass = "bg-surface-container-highest";
                      } else if (activity.type === "responsavel") {
                        icon = "person";
                        colorClass = "text-secondary";
                        bgClass = "bg-surface-container-highest";
                      }

                      const date = new Date(activity.timestamp);
                      const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                      const dateStr = date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });

                      return (
                        <div key={activity.id} className="relative flex items-center gap-4 group">
                          {/* Icon marker */}
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-container-low shrink-0 relative z-10 ${bgClass} ${colorClass}`}>
                            <span className="material-symbols-outlined text-[18px]">{icon}</span>
                          </div>
                          {/* Content */}
                          <div className="flex-1 p-3 rounded-lg bg-surface-container-highest/50 border border-outline-variant/10 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-on-surface">{activity.description}</span>
                            </div>
                            <div className="text-[10px] text-secondary/70">
                              {dateStr} às {timeStr}
                              {activity.atorId && ` • por ${getOperador(activity.atorId)?.nome || activity.atorId}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
