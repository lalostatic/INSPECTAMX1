import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getSession } from "@/lib/server/tenant";
import { SuperShell } from "@/components/super-shell";

export const Route = createFileRoute("/super")({ component: SuperLayout });

function SuperLayout() {
  const { user, isPending } = useCurrentUserState();
  const session = useQuery({ queryKey: ["session"], queryFn: () => getSession(), enabled: Boolean(user) });
  if (isPending || (user && session.isPending)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper">
        <p className="font-display text-2xl tracking-wide text-navy">INSPECTAMX</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" />;
  if (!session.data?.developer) return <Navigate to="/" />;
  return (
    <SuperShell email={session.data.email}>
      <Outlet />
    </SuperShell>
  );
}
