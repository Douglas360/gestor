"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useGestor } from "@/context/GestorContext";

function iso(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function Proximos7DiasPage() {
  const { tasks, selectTask } = useGestor();

  const today = new Date();
  const start = iso(today);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  const end = iso(endDate);

  const upcoming = tasks
    .filter((t) => !t.concluida)
    .filter((t) => t.dataVencimento && t.dataVencimento >= start && t.dataVencimento <= end)
    .sort((a, b) => String(a.dataVencimento).localeCompare(String(b.dataVencimento)));

  // group by date
  const groups = upcoming.reduce<Record<string, typeof upcoming>>((acc, t) => {
    const k = t.dataVencimento || "Sem data";
    acc[k] = acc[k] || [];
    acc[k].push(t);
    return acc;
  }, {});

  const dates = Object.keys(groups).sort();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <TopBar activeTab="Próximos 7 dias" searchPlaceholder="Buscar próximas tarefas..." />

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 pb-32">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Próximos 7 dias</h2>
            <p className="text-sm font-medium text-secondary">Tarefas com vencimento entre hoje e os próximos 7 dias.</p>
          </div>

          {dates.length === 0 ? (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-10 text-secondary">
              Nenhuma tarefa com vencimento nos próximos 7 dias.
            </div>
          ) : (
            dates.map((d) => (
              <section key={d} className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-on-surface mb-3">📅 {d}</h3>
                <div className="flex flex-col gap-2">
                  {groups[d]!.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        selectTask(t.id);
                        window.location.href = `/?selected=${t.id}`;
                      }}
                      className="text-left bg-surface-container-highest/30 hover:bg-surface-container-highest/50 border border-outline-variant/10 rounded-2xl p-4 transition-colors"
                    >
                      <div className="font-bold text-on-surface">{t.titulo}</div>
                      <div className="text-xs text-secondary mt-1">Status: {t.status}</div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
