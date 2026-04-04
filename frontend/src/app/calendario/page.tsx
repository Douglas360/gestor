"use client";

import { useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useGestor } from "@/context/GestorContext";
import type { Task } from "@/lib/types";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function iso(d: Date) {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function statusPill(task: Task) {
  switch (task.status) {
    case "concluida":
      return "bg-primary/15 text-primary";
    case "em_andamento":
      return "bg-sky-900/20 text-sky-300";
    case "em_revisao":
      return "bg-yellow-900/20 text-yellow-300";
    default:
      return "bg-surface-container-highest/40 text-secondary";
  }
}

function prioDot(task: Task) {
  switch (task.prioridade) {
    case "urgente":
      return "bg-error";
    case "alta":
      return "bg-orange-400";
    case "media":
      return "bg-yellow-400";
    case "baixa":
      return "bg-secondary/60";
    default:
      return "bg-secondary/60";
  }
}

export default function CalendarioPage() {
  const { tasks, selectTask } = useGestor();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => iso(new Date()));

  const { days, monthLabel, tasksByDate } = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);

    // Build a 6-week grid starting on Sunday
    const startWeekday = monthStart.getDay(); // 0..6
    const gridStart = addDays(monthStart, -startWeekday);

    const grid: Array<{ date: Date; outOfMonth: boolean; isToday: boolean; iso: string }> = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      const dIso = iso(d);
      grid.push({
        date: d,
        outOfMonth: d.getMonth() !== cursor.getMonth(),
        isToday: dIso === iso(new Date()),
        iso: dIso,
      });
    }

    const month = cursor.toLocaleString("pt-BR", { month: "long", year: "numeric" });

    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.dataVencimento) continue;
      map[t.dataVencimento] = map[t.dataVencimento] || [];
      map[t.dataVencimento].push(t);
    }

    // Sort tasks per day by priority then title
    const prioRank: Record<string, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => {
        const pa = prioRank[a.prioridade] ?? 9;
        const pb = prioRank[b.prioridade] ?? 9;
        if (pa !== pb) return pa - pb;
        return a.titulo.localeCompare(b.titulo);
      });
    }

    return { days: grid, monthLabel: month, tasksByDate: map, monthStart, monthEnd };
  }, [cursor, tasks]);

  const selectedTasks = tasksByDate[selectedDate] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="ml-64 flex flex-1 overflow-hidden">
        <section className="flex-1 flex flex-col bg-background">
          <TopBar activeTab="Próximos 7 dias" searchPlaceholder="Buscar tarefas..." />

          <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-on-surface tracking-tight capitalize">{monthLabel}</h2>
                <p className="text-on-surface-variant text-sm mt-1">
                  Clique em um dia para ver as tarefas com vencimento naquela data.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
                <button
                  className="p-2 hover:bg-surface-container-highest rounded transition-colors group"
                  onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">chevron_left</span>
                </button>
                <button
                  className="px-4 py-1.5 text-sm font-medium hover:bg-surface-container-highest rounded transition-colors text-on-surface"
                  onClick={() => {
                    const t = new Date();
                    setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
                    setSelectedDate(iso(t));
                  }}
                >
                  Hoje
                </button>
                <button
                  className="p-2 hover:bg-surface-container-highest rounded transition-colors group"
                  onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-outline-variant/10 shadow-2xl">
              <div className="grid grid-cols-7 bg-surface-container-low border-b border-outline-variant/10">
                {diasSemana.map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-[110px] bg-background">
                {days.map((dia) => {
                  const dayTasks = tasksByDate[dia.iso] || [];
                  const isSelected = selectedDate === dia.iso;

                  return (
                    <button
                      key={dia.iso}
                      onClick={() => setSelectedDate(dia.iso)}
                      className={`p-2 text-left border-b border-r border-outline-variant/10 hover:bg-surface-container-low/30 transition-colors ${
                        dia.outOfMonth ? "opacity-40" : ""
                      } ${isSelected ? "bg-surface-container-low/40 ring-2 ring-primary/20" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`text-sm font-bold ${dia.isToday ? "text-primary" : "text-on-surface"}`}>
                          {dia.date.getDate()}
                        </div>
                        {dayTasks.length > 0 ? (
                          <span className="text-[10px] text-secondary">{dayTasks.length}</span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-col gap-1">
                        {dayTasks.slice(0, 3).map((t) => (
                          <div key={t.id} className={`text-[10px] px-2 py-1 rounded font-medium truncate ${statusPill(t)}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${prioDot(t)}`} />
                            {t.titulo}
                          </div>
                        ))}
                        {dayTasks.length > 3 ? (
                          <div className="text-[10px] text-secondary">+{dayTasks.length - 3} mais</div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="w-96 bg-surface-container-low border-l border-outline-variant/10 p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tarefas do dia</div>
              <div className="text-lg font-bold text-on-surface">{selectedDate}</div>
            </div>
            <span className="text-xs text-secondary">{selectedTasks.length} tarefas</span>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="text-sm text-secondary bg-surface-container-highest/30 border border-outline-variant/10 rounded-2xl p-4">
              Nenhuma tarefa com vencimento nesta data.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    selectTask(t.id);
                    window.location.href = `/?selected=${t.id}`;
                  }}
                  className="text-left bg-surface-container-highest/30 hover:bg-surface-container-highest/50 border border-outline-variant/10 rounded-2xl p-4 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-on-surface truncate">{t.titulo}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${statusPill(t)}`}>{t.status}</span>
                  </div>
                  <div className="text-xs text-secondary mt-1">Prioridade: {t.prioridade}</div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
