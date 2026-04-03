import Sidebar from "@/components/Sidebar";

const dias = [
  // Semana 1 (dias anteriores ao mês)
  { num: 25, outOfMonth: true },
  { num: 26, outOfMonth: true },
  { num: 27, outOfMonth: true },
  { num: 28, outOfMonth: true },
  { num: 1 },
  { num: 2 },
  { num: 3 },
  // Semana 2
  { num: 4 },
  {
    num: 5,
    tasks: [
      { label: "Newsletter Verão", style: "bg-[#004395] text-[#adc6ff]" },
      { label: "Review Editorial", style: "bg-[#7f2927] text-[#ee7d77]" },
    ],
  },
  { num: 6 },
  { num: 7 },
  { num: 8, tasks: [{ label: "Post LinkedIn", style: "bg-[#3b3b3b] text-[#9f9d9d]" }] },
  { num: 9 },
  { num: 10 },
  // Semana 3
  { num: 11 },
  {
    num: 12,
    isToday: true,
    tasks: [
      { label: "Podcast #42", style: "bg-[#adc6ff] text-[#003d88] font-bold" },
      { label: "Thumbnail YT", style: "bg-[#facc15]/20 text-[#facc15]" },
    ],
  },
  { num: 13 },
  { num: 14 },
  {
    num: 15,
    tasks: [{ label: "Briefing Agência", style: "bg-primary/10 text-primary" }],
  },
  { num: 16 },
  { num: 17 },
  // Semana 4
  { num: 18 },
  { num: 19 },
  { num: 20 },
  { num: 21 },
  {
    num: 22,
    tasks: [{ label: "Ajuste Campanha", style: "bg-error-container/40 text-error" }],
  },
  { num: 23 },
  { num: 24 },
];

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarioPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="ml-64 flex flex-1 overflow-hidden">
        {/* Central Calendar Column */}
        <section className="flex-1 flex flex-col bg-background">
          {/* Header */}
          <header className="h-16 flex justify-between items-center w-full px-8 bg-[#0e0e0e] border-b border-outline-variant/10">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-black text-[#e5e5e5] tracking-tighter">
                Painel Editorial
              </h1>
              <nav className="hidden md:flex gap-6">
                <a
                  className="text-[#e5e5e5]/40 hover:text-[#e5e5e5] transition-colors duration-200 text-sm"
                  href="#"
                >
                  Visão Geral
                </a>
                <a
                  className="text-[#adc6ff] border-b-2 border-[#adc6ff] pb-1 font-medium text-sm"
                  href="#"
                >
                  Calendário
                </a>
                <a
                  className="text-[#e5e5e5]/40 hover:text-[#e5e5e5] transition-colors duration-200 text-sm"
                  href="#"
                >
                  Relatórios
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  search
                </span>
                <input
                  className="bg-surface-container-low border-none rounded-full py-1.5 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary/20 transition-all outline-none text-on-surface placeholder:text-secondary/50"
                  placeholder="Buscar tarefas..."
                  type="text"
                />
              </div>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                notifications
              </span>
              <button className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                Adicionar Tarefa
              </button>
            </div>
          </header>

          {/* Calendar Content */}
          <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-on-surface tracking-tight">Março 2026</h2>
                <p className="text-on-surface-variant text-sm mt-1">
                  12 campanhas agendadas para este mês.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
                <button className="p-2 hover:bg-surface-container-highest rounded transition-colors group">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">
                    chevron_left
                  </span>
                </button>
                <button className="px-4 py-1.5 text-sm font-medium hover:bg-surface-container-highest rounded transition-colors text-on-surface">
                  Hoje
                </button>
                <button className="p-2 hover:bg-surface-container-highest rounded transition-colors group">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-outline-variant/10 shadow-2xl">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 bg-surface-container-low border-b border-outline-variant/10">
                {diasSemana.map((d) => (
                  <div
                    key={d}
                    className="py-3 text-center text-xs font-bold text-on-surface-variant uppercase tracking-widest"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="calendar-grid flex-1">
                {dias.map((dia, i) => (
                  <div
                    key={i}
                    className={`calendar-day p-2 font-medium ${
                      dia.outOfMonth ? "text-[#e5e5e5]/20 opacity-40" : ""
                    } ${
                      dia.isToday
                        ? "bg-surface-container-low/30 border-2 border-primary/20"
                        : ""
                    }`}
                  >
                    {dia.isToday ? (
                      <span className="mb-1 flex items-center justify-between text-on-surface">
                        {dia.num}{" "}
                        <span className="w-1.5 h-1.5 bg-primary rounded-full inline-block"></span>
                      </span>
                    ) : (
                      <div className="text-on-surface mb-1">{dia.num}</div>
                    )}
                    {dia.tasks && (
                      <div className="flex flex-col gap-1">
                        {dia.tasks.map((task, ti) => (
                          <div
                            key={ti}
                            className={`text-[10px] px-2 py-1 rounded font-medium truncate ${task.style}`}
                          >
                            {task.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Task Details */}
        <aside className="w-96 bg-surface-container-low border-l border-outline-variant/10 p-6 flex flex-col gap-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Detalhes da Tarefa
            </span>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-sm">more_vert</span>
              </button>
            </div>
          </div>

          {/* Featured Image placeholder */}
          <div className="w-full h-48 rounded-xl overflow-hidden relative bg-surface-container-highest flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/30 to-surface-container-highest"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full w-fit mb-2 font-bold backdrop-blur-md">
                Aberto
              </span>
              <h3 className="text-xl font-bold text-on-surface leading-tight">
                Gravação: Podcast #42 - Futuro da IA
              </h3>
            </div>
            <span className="material-symbols-outlined text-primary/30 text-6xl z-10">
              podcasts
            </span>
          </div>

          {/* Meta Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-surface-container rounded-lg">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">event</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Data de Entrega</p>
                <p className="text-sm font-semibold text-on-surface">12 de Março, 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-surface-container rounded-lg">
              <div className="w-10 h-10 rounded bg-secondary-container/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">person</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">Responsável</p>
                <p className="text-sm font-semibold text-on-surface">Mariana Costa</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-on-surface mb-2">Descrição</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Gravação do episódio principal da semana com foco nas novas tendências de IA
              Generativa aplicada ao mercado editorial. Requer edição rápida para lançamento na
              sexta.
            </p>
          </div>

          {/* Checklist */}
          <div>
            <h4 className="text-sm font-bold text-on-surface mb-3">Subtarefas</h4>
            <div className="space-y-2">
              {[
                { label: "Validar pauta com convidado", done: true },
                { label: "Configurar estúdio e mics", done: false },
                { label: "Realizar gravação (2h)", done: false },
              ].map((sub, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 p-2 hover:bg-surface-container rounded transition-colors cursor-pointer group"
                >
                  <input
                    defaultChecked={sub.done}
                    className="rounded border-outline-variant bg-transparent text-primary focus:ring-0 focus:ring-offset-0"
                    type="checkbox"
                  />
                  <span
                    className={`text-sm ${
                      sub.done
                        ? "text-on-surface-variant line-through"
                        : "text-on-surface group-hover:text-primary transition-colors"
                    }`}
                  >
                    {sub.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="mt-auto pt-6 border-t border-outline-variant/10 flex gap-3">
            <button className="flex-1 bg-surface-container-highest text-on-surface py-2 rounded-lg text-sm font-semibold hover:bg-surface-bright transition-colors">
              Arquivar
            </button>
            <button className="flex-1 bg-primary text-on-primary py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all">
              Finalizar
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
