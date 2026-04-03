"use client";

type TopBarProps = {
  title?: string;
  activeTab?: string;
  searchPlaceholder?: string;
  extraActions?: React.ReactNode;
};

export default function TopBar({
  title = "Painel Editorial",
  activeTab = "Relatórios",
  searchPlaceholder = "Buscar tarefas...",
  extraActions,
}: TopBarProps) {
  return (
    <header className="flex justify-between items-center w-full px-8 h-16 bg-[#0e0e0e] shrink-0 border-b border-outline-variant/10">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-black text-[#e5e5e5] tracking-tighter">{title}</h1>
        <nav className="flex gap-6 items-center h-full">
          <a
            className="text-[#e5e5e5]/40 hover:text-[#e5e5e5] text-sm font-medium transition-colors"
            href="#"
          >
            Visão Geral
          </a>
          <a
            className="text-[#adc6ff] border-b-2 border-[#adc6ff] pb-1 text-sm font-medium"
            href="#"
          >
            {activeTab}
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-lg">
            search
          </span>
          <input
            className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-1.5 text-sm w-48 focus:w-64 focus:ring-1 focus:ring-primary/20 transition-all outline-none text-on-surface placeholder:text-secondary/50"
            placeholder={searchPlaceholder}
            type="text"
          />
        </div>
        <button className="material-symbols-outlined text-secondary hover:text-primary transition-colors">
          notifications
        </button>
        <button className="material-symbols-outlined text-secondary hover:text-primary transition-colors">
          help_outline
        </button>
        {extraActions}
      </div>
    </header>
  );
}
