"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import * as api from "@/lib/api";

function extractBase64Qr(qr: any): string | null {
  if (!qr) return null;

  // try common shapes
  const candidates = [
    qr?.base64,
    qr?.qrcode,
    qr?.qrcode?.base64,
    qr?.qr,
    qr?.qr?.base64,
    qr?.data?.base64,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.length > 50) {
      // sometimes it already comes as data:image/png;base64,...
      if (c.startsWith("data:image")) return c;
      return `data:image/png;base64,${c}`;
    }
  }

  return null;
}

function humanConnStatus(evolution: any, saved?: string | null) {
  const s = (
    evolution?.state ||
    evolution?.status ||
    evolution?.connection ||
    saved ||
    "unknown"
  );
  const str = String(s).toLowerCase();
  if (str.includes("open") || str.includes("connected")) return { label: "Conectado", color: "text-primary" };
  if (str.includes("close") || str.includes("disconnected") || str.includes("offline")) return { label: "Desconectado", color: "text-error-dim" };
  return { label: `Status: ${s}`, color: "text-secondary" };
}

export default function ConfiguracoesPage() {
  const [instances, setInstances] = useState<api.ApiWaInstance[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [qr, setQr] = useState<any>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeInstance = useMemo(
    () => instances.find((i) => i.id === activeInstanceId) || instances[0] || null,
    [instances, activeInstanceId]
  );

  async function reloadInstances() {
    const res = await api.listWaInstances();
    setInstances(res.data || []);
  }

  async function refreshStatus(instanceId: string) {
    const s = await api.getWaStatus(instanceId);
    setStatus(s);
    return s;
  }

  async function refreshQr(instanceId: string) {
    const q = await api.getWaQr(instanceId);
    setQr(q);
    return q;
  }

  async function handleCreateAndConnect() {
    setIsBusy(true);
    setError(null);
    setQr(null);
    setStatus(null);

    try {
      const created = await api.createWaInstance();
      const instanceId = created.instance.id;
      setActiveInstanceId(instanceId);
      await reloadInstances();

      // fetch status + qr
      await refreshStatus(instanceId);
      await refreshQr(instanceId);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefresh() {
    if (!activeInstance) return;
    setIsBusy(true);
    setError(null);
    try {
      await reloadInstances();
      await refreshStatus(activeInstance.id);
      await refreshQr(activeInstance.id);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteActive() {
    if (!activeInstance) return;
    if (!confirm(`Excluir a instância "${activeInstance.instance_name}"?`)) return;

    setIsBusy(true);
    setError(null);
    try {
      await api.deleteWaInstance(activeInstance.id);
      setActiveInstanceId(null);
      setQr(null);
      setStatus(null);
      await reloadInstances();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await reloadInstances();
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, []);

  useEffect(() => {
    // auto select latest
    if (!activeInstanceId && instances.length > 0) setActiveInstanceId(instances[0]!.id);
  }, [instances, activeInstanceId]);

  useEffect(() => {
    if (!activeInstance) return;
    void handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstance?.id]);

  const qrImage = extractBase64Qr(qr?.qr);
  const conn = humanConnStatus(status?.evolution, status?.saved_status);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="ml-64 flex flex-1 flex-col h-screen overflow-hidden bg-background">
        <TopBar activeTab="" searchPlaceholder="Buscar na plataforma..." />

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 pb-32">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Configurações</h2>
            <p className="text-sm font-medium text-secondary">
              Conexão WhatsApp (Evolution) e regras do sistema.
            </p>
          </div>

          <section className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined">chat</span>
                  WhatsApp (Evolution)
                </h3>
                <p className="text-sm text-secondary">
                  Crie uma instância e conecte escaneando o QR Code.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isBusy || !activeInstance}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-surface-container-highest text-on-surface hover:opacity-90 disabled:opacity-50"
                >
                  Atualizar
                </button>

                <button
                  onClick={handleDeleteActive}
                  disabled={isBusy || !activeInstance}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-error-container/40 text-error hover:bg-error-container/60 disabled:opacity-50"
                  title="Excluir instância"
                >
                  Excluir
                </button>

                <button
                  onClick={handleCreateAndConnect}
                  disabled={isBusy}
                  className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm tracking-tight transition-transform active:scale-95 flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_2</span>
                  Conectar via QR Code
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-surface-container-highest/30 border border-outline-variant/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-secondary uppercase tracking-widest">Status</div>
                      <div className={`text-sm font-bold ${conn.color}`}>{conn.label}</div>
                    </div>
                    {activeInstance && (
                      <div className="text-xs text-secondary">
                        <div><span className="font-bold">Instância:</span> {activeInstance.instance_name}</div>
                        <div><span className="font-bold">Salvo:</span> {activeInstance.status}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-surface-container-highest/30 border border-outline-variant/10 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">Instâncias</div>
                  {instances.length === 0 ? (
                    <p className="text-sm text-secondary">Nenhuma instância criada ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {instances.map((i) => (
                        <button
                          key={i.id}
                          onClick={() => setActiveInstanceId(i.id)}
                          className={`text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                            activeInstanceId === i.id
                              ? "bg-primary/15 border-primary/30 text-on-surface"
                              : "bg-transparent border-outline-variant/10 text-secondary hover:text-on-surface hover:bg-surface-container-highest/30"
                          }`}
                        >
                          <div className="font-bold">{i.instance_name}</div>
                          <div className="text-xs opacity-80">status: {i.status}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-error-container/30 border border-error/20 rounded-2xl p-4 text-error text-sm">
                    {error}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-bold text-secondary uppercase tracking-widest">QR Code</div>
                <div className="bg-surface-container-highest/30 border border-outline-variant/10 rounded-2xl p-4 flex items-center justify-center min-h-[320px]">
                  {qrImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrImage} alt="QR Code WhatsApp" className="w-[280px] h-[280px] rounded-xl bg-white p-3" />
                  ) : (
                    <div className="text-center text-secondary">
                      <span className="material-symbols-outlined text-4xl opacity-50">qr_code</span>
                      <p className="mt-2 text-sm">Clique em “Conectar via QR Code” para gerar o QR.</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-secondary">
                  Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo → escaneie.
                </p>

                {/* debug (useful while we stabilize payload) */}
                {qr && (
                  <details className="text-xs text-secondary">
                    <summary className="cursor-pointer">Debug QR (payload)</summary>
                    <pre className="whitespace-pre-wrap break-words mt-2 bg-black/30 p-3 rounded-xl border border-outline-variant/10">
                      {JSON.stringify(qr, null, 2)}
                    </pre>
                  </details>
                )}
                {status && (
                  <details className="text-xs text-secondary">
                    <summary className="cursor-pointer">Debug Status (payload)</summary>
                    <pre className="whitespace-pre-wrap break-words mt-2 bg-black/30 p-3 rounded-xl border border-outline-variant/10">
                      {JSON.stringify(status, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
