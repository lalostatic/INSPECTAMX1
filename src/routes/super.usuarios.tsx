import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALL_ROLES, ROLE_LABEL, type Role } from "@/lib/catalog";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import {
  forceLogout,
  listSuperUsers,
  resetUserPassword,
  setMemberBlocked,
  setUserRole,
} from "@/lib/server/platform";

export const Route = createFileRoute("/super/usuarios")({ component: Usuarios });

function Usuarios() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["super-users"], queryFn: () => listSuperUsers() });
  const [org, setOrg] = useState("todas");
  const [role, setRole] = useState("todos");
  const [qtext, setQtext] = useState("");
  const orgs = useMemo(
    () => [...new Set((q.data ?? []).map((u) => u.orgName))].sort(),
    [q.data],
  );
  const rows = (q.data ?? []).filter((u) => {
    if (org !== "todas" && u.orgName !== org) return false;
    if (role !== "todos" && u.role !== role) return false;
    if (qtext) {
      const hay = `${u.name} ${u.email}`.toLowerCase();
      if (!hay.includes(qtext.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl text-navy">Usuarios</h1>
      <p className="text-sm text-steel">Todas las empresas. Rol, bloqueo, contraseña y cierre de sesión.</p>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar" value={qtext} onChange={(e) => setQtext(e.target.value)} className="max-w-xs" />
        <select
          className="h-11 rounded-md border border-line bg-card px-3 text-sm"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
        >
          <option value="todas">Todas las empresas</option>
          {orgs.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select
          className="h-11 rounded-md border border-line bg-card px-3 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="todos">Todos los roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-auto rounded-lg border border-line bg-card shadow-card">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-navy text-paper">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Último acceso</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.userId + u.orgId} className={u.blocked ? "opacity-50" : ""}>
                <td className="px-3 py-2">
                  {u.name} {u.blocked ? <Badge tone="rust">bloqueado</Badge> : null}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-3 py-2">{u.orgName}</td>
                <td className="px-3 py-2">
                  <select
                    className="rounded-sm border border-line bg-card px-2 py-1"
                    value={u.role}
                    onChange={(e) => {
                      void setUserRole({
                        data: { userId: u.userId, orgId: u.orgId, role: e.target.value as Role },
                      }).then(() => {
                        toast.success("Rol actualizado");
                        void qc.invalidateQueries({ queryKey: ["super-users"] });
                      });
                    }}
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-xs text-steel">{u.lastSeen ? u.lastSeen.slice(0, 16) : "—"}</td>
                <td className="px-3 py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void resetUserPassword({ data: { userId: u.userId, password: DEMO_PASSWORD } }).then(() =>
                        toast.success(`Contraseña: ${DEMO_PASSWORD}`),
                      );
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void forceLogout({ data: { userId: u.userId } }).then(() => toast.success("Sesión cerrada"));
                    }}
                  >
                    Cerrar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void setMemberBlocked({
                        data: { userId: u.userId, orgId: u.orgId, blocked: !u.blocked },
                      }).then(() => {
                        toast.success(u.blocked ? "Desbloqueado" : "Bloqueado");
                        void qc.invalidateQueries({ queryKey: ["super-users"] });
                      });
                    }}
                  >
                    {u.blocked ? "Activar" : "Bloquear"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
