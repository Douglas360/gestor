import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function MeuDiaPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col">
        <TopBar activeTab="Meu Dia" searchPlaceholder="Buscar tarefas de hoje..." />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-6xl text-primary/30">today</span>
          <h2 className="text-2xl font-bold text-on-surface">Meu Dia</h2>
          <p className="text-sm">Suas tarefas de hoje aparecerão aqui.</p>
        </div>
      </main>
    </div>
  );
}
