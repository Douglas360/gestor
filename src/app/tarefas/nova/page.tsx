"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useGestor } from "@/context/GestorContext";
import { Priority, Status } from "@/lib/types";
import { TAGS_SUGERIDAS } from "@/lib/mockData";

const PRIORITIES: { value: Priority; label: string; color: string; icon: string }[] = [
  { value: "urgente", label: "Urgente", color: "text-red-400 bg-red-900/30 border-red-900/50", icon: "local_fire_department" },
  { value: "alta", label: "Alta", color: "text-orange-400 bg-orange-900/20 border-orange-900/40", icon: "priority_high" },
  { value: "media", label: "Média", color: "text-yellow-400 bg-yellow-900/20 border-yellow-900/40", icon: "drag_handle" },
  { value: "baixa", label: "Baixa", color: "text-sky-400 bg-sky-900/20 border-sky-900/40", icon: "arrow_downward" },
];

const STATUSES: { value: Status; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "em_revisao", label: "Em Revisão" },
  { value: "concluida", label: "Concluída" },
];

export default function NovaTarefaPage() {
  const router = useRouter();
  const { createTask, operadores } = useGestor();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<Priority>("media");
  const [status, setStatus] = useState<Status>("pendente");
  const [dataVencimento, setDataVencimento] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOps = useMemo(() => operadores.filter((o) => o.status === "ativo"), [operadores]);

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function addCustomTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) {
      setError("O título é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createTask({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        prioridade,
        status,
        dataVencimento: dataVencimento || undefined,
        responsavelId: responsavelId || undefined,
        tags,
      });

      // back to list selecting task
      router.push(`/?selected=${created.id}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedPriority = PRIORITIES.find((p) => p.value === prioridade)!;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="ml-64 flex flex-1 flex-col h-screen overflow-hidden bg-background">
        <TopBar activeTab="" searchPlaceholder="Buscar na plataforma..." />

        <div className="flex-1 overflow-y-auto px-8 py-8 pb-32">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Nova Tarefa</h2>
              <p className="text-sm font-medium text-secondary">Cadastre uma tarefa e atribua a um operador.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-xl font-bold text-sm bg-surface-container-highest text-on-surface hover:opacity-90"
            >
              Voltar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            {error && (
              <div className="bg-error-container/30 border border-error/20 rounded-2xl p-4 text-error text-sm">
                {error}
              </div>
            )}

            {/* Título */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Gravar episódio #43 do podcast..."
                className="w-full bg-surface-container-highest/50 rounded-xl px-4 py-3 text-on-surface placeholder:text-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Adicione detalhes ou contexto..."
                rows={4}
                className="w-full bg-surface-container-highest/50 rounded-xl px-4 py-3 text-on-surface placeholder:text-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prioridade */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Prioridade</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPrioridade(p.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                        prioridade === p.value
                          ? p.color
                          : "bg-surface-container-highest/30 text-on-surface-variant border-outline-variant/20 hover:border-outline-variant/40"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-secondary">Selecionado: <span className="font-bold">{selectedPriority.label}</span></div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Status inicial</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                        status === s.value
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-surface-container-highest/30 text-on-surface-variant border-outline-variant/20 hover:border-outline-variant/40"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status === s.value ? "bg-primary" : "bg-secondary/40"}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Responsável */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Responsável</label>
                <select
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                  className="w-full bg-surface-container-highest/50 rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]"
                >
                  <option value="">Não atribuir agora</option>
                  {activeOps.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nome}
                    </option>
                  ))}
                </select>
                {activeOps.length === 0 && (
                  <p className="text-xs text-secondary">Nenhum operador ativo cadastrado.</p>
                )}
              </div>

              {/* Vencimento */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Data de vencimento</label>
                <input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full bg-surface-container-highest/50 rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAGS_SUGERIDAS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      tags.includes(t)
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-surface-container-highest/30 text-secondary border-outline-variant/20 hover:border-outline-variant/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Adicionar tag..."
                  className="flex-1 bg-surface-container-highest/50 rounded-xl px-4 py-2 text-on-surface placeholder:text-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-surface-container-highest text-on-surface hover:opacity-90"
                >
                  Adicionar
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm tracking-tight transition-transform active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? "Salvando..." : "Criar tarefa"}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl font-bold text-sm tracking-tight text-secondary hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
