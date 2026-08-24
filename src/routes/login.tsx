import { createFileRoute } from "@tanstack/react-router";
import { LoginView } from "@/components/login-view";
import { ensureDemoUsers } from "@/lib/server/demo-boot";

export const Route = createFileRoute("/login")({
  loader: async () => {
    void ensureDemoUsers();
    return {};
  },
  component: LoginView,
});
