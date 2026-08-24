import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * Método de pago desactivado de momento.
 * Se reactivará cuando exista la estructura de cobro.
 */
export const Route = createFileRoute("/pago")({
  component: () => <Navigate to="/" />,
});
