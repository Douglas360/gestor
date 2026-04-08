"use client";

import { useState, useEffect, useRef } from "react";
import { useGestor } from "@/context/GestorContext";
import { Priority, Status } from "@/lib/types";
import { TAGS_SUGERIDAS } from "@/lib/mockData"; // static suggestions are fine

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

export default function NewTaskModal() {
  const { isNewTaskModalOpen, closeNewTaskModal, createTask, operadores } = useGestor();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<Priority>("media");
  const [status, setStatus] = useState<Status>("pendente");
  const [dataVencimento, setDataVencimento] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ titulo?: string }>({});

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isNewTaskModalOpen) {
      setTitulo("");
      setDescricao("");
      setPrioridade("media");
      setStatus("pendente");
      setDataVencimento("");
      setResponsavelId("");
      setTags([]);
      setTagInput("");
      setErrors({});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isNewTaskModalOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNewTaskModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeNewTaskModal]);

  function validate() {
    const e: { titulo?: string } = {};
    if (!titulo.trim()) e.titulo = "O título é obrigatório.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    try {
      await createTask({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        prioridade,
        status,
        dataVencimento: dataVencimento || undefined,
        responsavelId: responsavelId || undefined,
        tags,
      });
      closeNewTaskModal();
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  if (!isNewTaskModalOpen) return null;

  const activeOps = operadores.filter((o) => o.status === "ativo");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
        onClick={closeNewTaskModal}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-xl bg-[#131313] rounded-2xl shadow-2xl border border-outline-variant/20 flex flex-col max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">add_task</span>
              <h2 className="text-lg font-bold text-on-surface tracking-tight">Nova Tarefa</h2>
            </div>
            <button
              onClick={closeNewTaskModal}
              className="p-1.5 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">

              {/* Título */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Título da Tarefa *
                </label>
                <input
                  ref={inputRef}
                  id="task-titulo"
                  type="text"
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    if (e.target.value.trim()) setErrors((p) => ({ ...p, titulo: undefined }));
                  }}
                  placeholder="Ex: Gravar episódio #43 do podcast..."
                  className={`w-full bg-surface-container-highest/50 rounded-xl px-4 py-3 text-on-surface placeholder:text-secondary/40 text-sm outline-none focus:ring-2 transition-all ${
                    errors.titulo
                      ? "ring-2 ring-error/60"
                      : "focus:ring-primary/30"
                  }`}
                />
                {errors.titulo && (
                  <p className="text-error text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errors.titulo}
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Descrição
                </label>
                <textarea
                  id="task-descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Adicione detalhes ou contexto..."
                  rows={3}
                  className="w-full bg-surface-container-highest/50 rounded-xl px-4 py-3 text-on-surface placeholder:text-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
                />
              </div>

              {/* Priority + Status row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Prioridade */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                    Prioridade
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPrioridade(p.value)}
                        className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
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
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                    Status Inicial
                  </label>
                  <div className="space-y-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStatus(s.value)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          status === s.value
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-surface-container-highest/30 text-on-surface-variant border-outline-variant/20 hover:border-outline-variant/40"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            status === s.value ? "bg-primary" : "bg-secondary/40"
                          }`}
                        />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Responsável
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResponsavelId("")}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      responsavelId === ""
                        ? "bg-surface-container-highest border-outline-variant/40 text-on-surface"
                        : "bg-surface-container-highest/30 border-outline-variant/10 text-secondary hover:border-outline-variant/30"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">person_off</span>
                    Sem responsável
                  </button>
                  {activeOps.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setResponsavelId(op.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        responsavelId === op.id
                          ? "bg-primary/20 border-primary/30 text-on-surface"
                          : "bg-surface-container-highest/30 border-outline-variant/10 text-secondary hover:border-outline-variant/30"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        responsavelId === op.id ? "bg-primary/30 text-primary" : "bg-secondary/20 text-secondary"
                      }`}>
                        {op.initials}
                      </div>
                      <span className="truncate">{op.nome.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Data de Vencimento
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg pointer-events-none">
                    event
                  </span>
                  <input
                    id="task-data"
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full bg-surface-container-highest/50 rounded-xl pl-10 pr-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {TAGS_SUGERIDAS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        tags.includes(tag)
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-surface-container-highest/30 text-secondary border-outline-variant/20 hover:border-outline-variant/50"
                      }`}
                    >
                      {tags.includes(tag) && "✓ "}
                      {tag}
                    </button>
                  ))}
                </div>
                {/* Custom tag input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    placeholder="Tag personalizada... (Enter para adicionar)"
                    className="flex-1 bg-surface-container-highest/50 rounded-xl px-3 py-2 text-on-surface placeholder:text-secondary/40 text-xs outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="px-3 py-2 bg-surface-container-highest rounded-xl text-secondary hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 text-primary rounded-full text-[11px] font-bold border border-primary/20"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/10 flex gap-3 bg-[#0e0e0e]">
              <button
                type="button"
                onClick={closeNewTaskModal}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors border border-outline-variant/20"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-criar-tarefa"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-primary text-on-primary hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Criando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">add_task</span>
                    Criar Tarefa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
