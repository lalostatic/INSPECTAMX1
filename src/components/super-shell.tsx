import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { useState, type ReactNode } from "react";
import { Wordmark } from "./mark";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; group: string }[] = [
  { group: "Principal", to: "/super", label: "Dashboard" },
  { group: "Empresas", to: "/super/empresas", label: "Empresas" },
  { group: "Empresas", to: "/super/usuarios", label: "Usuarios" },
  { group: "Empresas", to: "/super/analytics", label: "Analytics" },
  { group: "Sistema", to: "/super/sistema", label: "Estado y logs" },
  { group: "Sistema", to: "/super/backups", label: "Backups" },
  { group: "Sistema", to: "/super/integraciones", label: "Integraciones" },
  { group: "Config", to: "/super/configuracion", label: "Global" },
  { group: "Config", to: "/super/seguridad", label: "Seguridad" },
  { group: "Config", to: "/super/catalogos", label: "Catálogos" },
  { group: "Desarrollo", to: "/super/desarrollo", label: "Desarrollo" },
  { group: "Soporte", to: "/super/soporte", label: "Tickets" },
  { group: "Soporte", to: "/super/avisos", label: "Avisos" },
];

export function SuperShell({ email, children }: { email: string; children?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [out, setOut] = useState(false);
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <div className="min-h-dvh bg-paper text-ink md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-navy-deep bg-navy text-paper md:min-h-dvh md:border-b-0 md:border-r">
        <div className="flex h-14 items-center px-4">
          <Wordmark light />
        </div>
        <p className="px-4 pb-2 text-[10px] uppercase tracking-[0.2em] text-paper/50">Superadmin</p>
        <nav className="max-h-[70vh] space-y-3 overflow-auto px-2 pb-4 md:max-h-none">
          {groups.map((g) => (
            <div key={g}>
              <p className="px-2 pb-1 text-[10px] uppercase tracking-wider text-paper/40">{g}</p>
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = n.to === "/super" ? path === "/super" : path.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "block rounded-sm px-2 py-1.5 text-sm",
                      active ? "bg-paper/15 text-paper" : "text-paper/70 hover:bg-paper/5 hover:text-paper",
                    )}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-paper/10 px-4 py-3 text-xs text-paper/60">
          <p className="truncate">{email}</p>
          <button
            type="button"
            disabled={out}
            className="mt-1 text-paper/80 underline"
            onClick={() => {
              setOut(true);
              void signOut("/login");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div>
        <header className="flex h-14 items-center justify-between border-b border-line px-4">
          <p className="text-sm text-steel">INSPECTAMX · inspectamx.com</p>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-6">{children ?? <Outlet />}</div>
      </div>
    </div>
  );
}
