"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";

type NavItem = {
  icon: string;
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { icon: "today", label: "Meu dia", href: "/meu-dia" },
  { icon: "calendar_month", label: "Próximos 7 dias", href: "/calendario" },
  { icon: "task", label: "Todas as tarefas", href: "/" },
  { icon: "group", label: "Equipe", href: "/equipe" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [tenantName, setTenantName] = useState<string>("Gestor");
  const [adminPhone, setAdminPhone] = useState<string | null>(null);

  const initials = useMemo(() => {
    const parts = tenantName.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "G";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
  }, [tenantName]);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.getTenantSettings();
        setTenantName(s?.name || "Gestor");
        setAdminPhone(s?.admin_wa_phone || null);
      } catch {
        // ignore (e.g. not logged yet)
      }
    })();
  }, []);

  return (
    <aside className="h-screen w-64 flex flex-col fixed left-0 top-0 bg-[#131313] font-inter antialiased tracking-tight text-sm py-6 space-y-4 z-50">
      {/* Profile */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold text-[#e5e5e5] truncate">{tenantName}</span>
            <span className="text-xs text-[#e5e5e5]/40 tracking-wider truncate">
              {adminPhone ? `Alertas: ${adminPhone}` : "Configurar alertas em Configurações"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "text-[#adc6ff] font-medium bg-[#262626]"
                  : "text-[#e5e5e5]/60 hover:text-[#e5e5e5] hover:bg-[#262626]"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Listas removidas no MVP */}

      {/* Footer */}
      <div className="pt-4 border-t border-outline-variant/10 space-y-1">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 text-[#e5e5e5]/60 hover:text-[#e5e5e5] px-3 py-2 mx-2 transition-colors duration-200"
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Configurações</span>
        </Link>
        <Link
          href="/sair"
          className="flex items-center gap-3 text-error/60 hover:text-error px-3 py-2 mx-2 transition-colors duration-200"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  );
}
