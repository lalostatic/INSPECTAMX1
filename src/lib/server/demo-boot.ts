import { createServerFn } from "@tanstack/react-start";

/** Starts seed in the background. Safe to call from a route loader. */
export const ensureDemoUsers = createServerFn({ method: "GET" }).handler(async () => {
  const { startDemoSeed } = await import("./demo-seed");
  startDemoSeed();
  return { ok: true };
});

/** Resolves when demo logins exist. Patio data may still be filling in. */
export const waitAuthReady = createServerFn({ method: "GET" }).handler(async () => {
  const { waitAuthSeed } = await import("./demo-seed");
  await Promise.race([
    waitAuthSeed(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("El patio sigue preparándose. Intente de nuevo.")), 15000);
    }),
  ]);
  return { ok: true };
});
