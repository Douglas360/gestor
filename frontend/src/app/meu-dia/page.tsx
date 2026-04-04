"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useGestor } from "@/context/GestorContext";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function MeuDiaPage() {
  const { tasks, selectTask } = useGestor();

  const today = todayISO();

  const overdue = tasks.filter((t) => !t.concluida && t.dataVencimento && t.dataVencimento < today);
  const dueToday = tasks.filter((t) => !t.concluida && t.dataVencimento === today);

  const render = (title: string, items: typeof tasks) => (
    <section className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6">
      <h3 className="text-lg font-bold text-on-surface mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-secondary">Nada por aqui.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                selectTask(t.id);
                window.location.href = `/?selected=${t.id}`;
              }}
              className="text-left bg-surface-container-highest/30 hover:bg-surface-container-highest/50 border border-outline-variant/10 rounded-2xl p-4 transition-colors"
            >
              <div className="font-bold text-on-surface">{t.titulo}</div>
              <div className="text-xs text-secondary mt-1">
                {t.dataVencimento ? `Vence: ${t.dataVencimento}` : "Sem vencimento"}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <TopBar activeTab="Meu Dia" searchPlaceholder="Buscar tarefas de hoje..." />

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 pb-32">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Meu Dia</h2>
            <p className="text-sm font-medium text-secondary">Priorize o que vence hoje e o que já está atrasado.</p>
          </div>

          {render("⏰ Atrasadas", overdue)}
          {render("📅 Vencem hoje", dueToday)}
        </div>
      </main>
    </div>
  );
}
