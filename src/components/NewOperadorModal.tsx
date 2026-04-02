"use client";

import { useState } from "react";
import { useGestor } from "@/context/GestorContext";
import { normalizeWhatsappPhone } from "@/lib/phone";

export default function NewOperadorModal() {
  const { isNewOperadorModalOpen, closeNewOperadorModal, createOperador } = useGestor();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [cargo, setCargo] = useState("");

  if (!isNewOperadorModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      alert("Nome é obrigatório!");
      return;
    }

    const normalized = normalizeWhatsappPhone(whatsapp);
    if (!normalized.ok) {
      setWhatsappError(normalized.error);
      return;
    }

    await createOperador({
      nome: nome.trim(),
      email: email.trim(),
      whatsapp: normalized.value,
      cargo: cargo.trim(),
    });

    handleClose();
  };

  const handleClose = () => {
    setNome("");
    setEmail("");
    setWhatsapp("");
    setCargo("");
    setWhatsappError(null);
    closeNewOperadorModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-surface-container-low rounded-3xl shadow-2xl border border-outline-variant/20 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Novo Operador</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-secondary"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="new-operador-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">
                Nome Completo <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Ana Silva"
                className="w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-secondary/50 transition-all border border-transparent focus:border-primary/30"
                autoFocus
                required
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">
                WhatsApp <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  if (whatsappError) setWhatsappError(null);
                }}
                onBlur={() => {
                  const normalized = normalizeWhatsappPhone(whatsapp);
                  if (normalized.ok) setWhatsapp(normalized.value);
                }}
                placeholder="Ex: +55 11 99999-9999"
                className={`w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 placeholder:text-secondary/50 transition-all border ${
                  whatsappError ? "border-error focus:ring-error/40" : "border-transparent focus:border-primary/30 focus:ring-primary/50"
                }`}
                required
              />
              {whatsappError && (
                <p className="text-error text-xs font-medium">{whatsappError}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: ana.silva@empresa.com"
                className="w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-secondary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary uppercase tracking-widest">
                Cargo / Função
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Redatora Sênior"
                className="w-full bg-surface-container-highest p-4 rounded-xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-secondary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-outline-variant/10 flex justify-end gap-3 bg-surface-container-low/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-tight text-secondary hover:text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-operador-form"
            className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm tracking-tight transition-transform active:scale-95 shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            Cadastrar Operador
          </button>
        </div>
      </div>
    </div>
  );
}
