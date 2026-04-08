"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useGestor } from "@/context/GestorContext";
import { Operador } from "@/lib/types";
import { formatWhatsappPhone } from "@/lib/phoneFormat";
import { normalizeWhatsappPhone } from "@/lib/phone";

export default function EquipePage() {
  const { operadores, openNewOperadorModal, updateOperador, deleteOperador, tasks } = useGestor();
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Operador | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editCargo, setEditCargo] = useState("");
  const [editStatus, setEditStatus] = useState<"ativo" | "inativo">("ativo");
  const [editError, setEditError] = useState<string | null>(null);

  const filteredOperadores = operadores.filter((op) =>
    op.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.whatsapp.includes(searchTerm)
  );

  const toggleStatus = (op: Operador) => {
    updateOperador(op.id, { status: op.status === "ativo" ? "inativo" : "ativo" });
  };

  const openEdit = (op: Operador) => {
    setEditing(op);
    setEditNome(op.nome);
    setEditEmail(op.email || "");
    setEditWhatsapp(op.whatsapp);
    setEditCargo(op.cargo || "");
    setEditStatus(op.status);
    setEditError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const normalized = normalizeWhatsappPhone(editWhatsapp);
    if (!normalized.ok) {
      setEditError(normalized.error);
      return;
    }

    await updateOperador(editing.id, {
      nome: editNome.trim(),
      email: editEmail.trim() || undefined,
      whatsapp: normalized.value,
      cargo: editCargo.trim(),
      status: editStatus
    });

    closeEdit();
  };

  const activeOperators = operadores.filter((op) => op.status === "ativo").length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="ml-64 flex flex-1 flex-col h-screen overflow-hidden bg-background">
        <TopBar activeTab="" searchPlaceholder="Buscar na plataforma..." />

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 pb-32">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">
                Equipe & Operadores
              </h2>
              <p className="text-sm font-medium text-secondary">
                Gerencie todos os membros do time. Há {activeOperators} membros ativos.
              </p>
            </div>
            <button
              onClick={openNewOperadorModal}
              className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm tracking-tight transition-transform active:scale-95 flex items-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Novo Operador
            </button>
          </div>

          {/* Search bar specifically for Team */}
          <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/10 shadow-sm max-w-md">
            <span className="material-symbols-outlined text-secondary ml-3">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou zap..."
              className="bg-transparent border-none outline-none text-sm font-medium text-on-surface w-full py-2 placeholder:text-secondary/50"
            />
          </div>

          {/* Table/List of Operators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOperadores.length === 0 && (
              <div className="col-span-full text-center py-20 text-secondary">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">group_off</span>
                <p>Nenhum operador encontrado.</p>
              </div>
            )}

            {filteredOperadores.map((op) => {
              // Calculate how many active tasks they have
              const tarefasAtivas = tasks.filter(t => t.responsavelId === op.id && !t.concluida).length;

              return (
                <div
                  key={op.id}
                  className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 transition-all hover:bg-surface-container-high group relative overflow-hidden"
                >
                  {/* Status Indicator */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${op.status === "ativo" ? "bg-primary" : "bg-error"}`} />
                  
                  <div className="flex justify-between items-start mb-6 mt-2">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-xl font-bold border-2 border-primary/30 shadow-inner">
                      {op.initials}
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === op.id ? null : op.id)}
                        className="material-symbols-outlined text-secondary/50 hover:text-on-surface transition-colors p-2 -mr-2 -mt-2"
                      >
                        more_vert
                      </button>

                      {menuOpenId === op.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-[#1b1b1b] border border-outline-variant/20 rounded-xl shadow-xl z-10">
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              openEdit(op);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest/40 rounded-t-xl"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              if (confirm("Tem certeza que deseja excluir este operador?")) {
                                deleteOperador(op.id);
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-error-dim hover:bg-error-container/40 rounded-b-xl"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-on-surface leading-tight mb-1 truncate">
                      {op.nome}
                    </h3>
                    <p className="text-[11px] font-bold text-secondary uppercase tracking-widest truncate">
                      {op.cargo}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-secondary">
                      <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
                      <span className="truncate">{formatWhatsappPhone(op.whatsapp)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-secondary">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      <span className="truncate">{op.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-secondary">
                      <span className="material-symbols-outlined text-[18px]">assignment</span>
                      <span className="font-bold text-on-surface">{tarefasAtivas} tarefas</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-widest">
                        Status
                      </span>
                      <button
                        onClick={() => toggleStatus(op)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter ${
                          op.status === "ativo"
                            ? "bg-primary/20 text-primary"
                            : "bg-error/20 text-error-dim"
                        }`}
                      >
                        {op.status === "ativo" ? "Ativo" : "Inativo"}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir este operador?")) {
                          deleteOperador(op.id);
                        }
                      }}
                      className="text-error-dim hover:bg-error-container/50 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      title="Excluir operador"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative w-full max-w-lg bg-surface-container-low rounded-3xl shadow-2xl border border-outline-variant/20 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">Editar Operador</h2>
              <button
                onClick={closeEdit}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-secondary"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">Nome</label>
                <input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none border border-transparent focus:border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">WhatsApp</label>
                <input
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  className="w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none border border-transparent focus:border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">E-mail</label>
                <input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none border border-transparent focus:border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">Cargo / Função</label>
                <input
                  value={editCargo}
                  onChange={(e) => setEditCargo(e.target.value)}
                  className="w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none border border-transparent focus:border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none border border-transparent focus:border-primary/30"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              {editError && <div className="text-error text-xs font-medium">{editError}</div>}
            </div>

            <div className="p-6 border-t border-outline-variant/10 flex justify-end gap-3 bg-surface-container-low/50">
              <button
                onClick={closeEdit}
                className="px-6 py-3 rounded-xl font-bold text-sm tracking-tight text-secondary hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm tracking-tight transition-transform active:scale-95 shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
