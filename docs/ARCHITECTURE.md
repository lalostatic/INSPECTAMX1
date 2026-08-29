# INSPECTAMX — arquitectura de producción

Fecha de auditoría: 2026-08-29  
Repositorio: `lalostatic/INSPECTAMX` @ `970afa3`

## Decisión (no negociable en este ciclo)

**No se migra la base de datos a Cloudflare D1.**

El producto ya es un SaaS multi-tenant sobre **Postgres con esquema por empresa** (`t_<uuid>`). D1 es SQLite: no tiene schemas, no habla el SQL de las migraciones actuales, no soporta el dialecto de Better Auth + Kysely/`pg`, y no es el lugar para JPEG en `data_url`. Reescribir a D1 sería un cambio de arquitectura de semanas con riesgo de pérdida de aislamiento entre patios.

Servicios Cloudflare que **sí** corresponden ahora:

| Servicio | ¿Usar? | Motivo |
|---|---|---|
| DNS + SSL/TLS + WAF | Sí | `inspectamx.com` hoy **no resuelve** |
| CDN / cache estático | Sí | `DEMO/` y `public/` |
| Pages (sitio estático) | Sí | marketing / DEMO |
| Workers como runtime de la app | No, todavía | el bundle Nitro es preset `vercel`; `pg` + PGLite rompen el isolate |
| D1 | No | incompatibilidad con schema-per-tenant |
| R2 | Próximo ciclo | fotos hoy viven en Postgres |
| KV / Queues / DO / Workers AI | No | no hay carga que los justifique |

## Arquitectura actual (comprobada en código)

```
GitHub  lalostatic/INSPECTAMX
   |
   ├── DEMO/ + docs/     → GitHub Pages (sí responde 200)
   |
   └── App TanStack Start + Nitro preset "vercel"
            |
            ├── Frontend  React 19 + Tailwind v4 + Vite 8
            ├── RPC       createServerFn (no REST clásico)
            ├── Auth      Better Auth email/password (+ broker Grok opcional)
            └── Datos     Neon Postgres  —o—  PGLite embebido si no hay DATABASE_URL
                            |
                            ├── public.*          (plataforma, orgs, billing, auth)
                            └── t_<uuid>.*        (patio: inspections, records, photos…)
```

Lo que hay desplegado hoy:

| Host | Estado |
|---|---|
| `https://inspectamx.com` | **DNS no resuelve** |
| `https://inspectamx.lalostatic.workers.dev` | **HTTP 500** `{"status":500,"unhandled":true,"message":"HTTPError"}` |
| `https://lalostatic.github.io/INSPECTAMX/` | 200, DEMO estático |
| Worker | bundle incompatible (Nitro `vercel` + `import { Pool } from "pg"` en `auth/server.ts`) |

## Multi-tenancy (ya implementado)

1. Plataforma en `public.organizations` / `org_members` / billing.
2. Cada empresa recibe `db_schema = t_<uuid>` (`src/lib/server/tenant-schema.ts`).
3. Las consultas de patio se ejecutan **dentro de ese schema**, no con un `tenant_id` suelto sobre tablas compartidas.
4. El inspector solo ve sus folios; admin/oficina ven el patio propio, nunca otro (`src/lib/roles.ts`).
5. Aislamiento extra contra apps hermanas: `isolation.server.ts` (Fetch Metadata) + cookies `__Host-`.

Eso es aislamiento real. No se sustituye por D1 + `tenant_id` en este ciclo.

## Runtime correcto

La app es un servidor **Node**:

- `pg` (sockets TCP) para Neon
- `@electric-sql/pglite` (WASM + FS) para preview
- `node:crypto`, `node:fs`, `node:child_process` en scripts
- Nitro `preset: "vercel"` en `vite.config.ts`

Eso corre en **Vercel / Fly / Railway / un VPS**. No corre, tal cual, en Cloudflare Workers.

Camino de producción mínimo:

```
Usuario
  → Cloudflare (DNS, SSL, WAF, CDN)
      → Origin Node (Vercel u otro)
          → Neon Postgres (DATABASE_URL)
```

Camino Workers (futuro, no este commit):

```
NITRO_PRESET=cloudflare_module
+ compatibility_flags = ["nodejs_compat"]
+ Neon Hyperdrive (no PGLite)
+ quitar import estático de `pg` / PGlite del grafo del Worker
```

Hasta que eso exista, `wrangler deploy` del artefacto actual **seguirá en 500**.

## Auth

- Login: email/password (`src/lib/auth/email-password.ts` → `true`).
- Better Auth en `/api/auth/*`.
- Cookie `__Host-grok-auth.session_token`.
- Superadmin documentado: `desarrollo@inspectamx.com` / `desarrolo@inspectamx.com`.
- No hay alta pública; el admin crea usuarios en Equipo.
- `BETTER_AUTH_SECRET` debe ser un secreto de plataforma. Si falta, preview fabrica uno aleatorio — **inválido en producción**.

## Archivos / fotos

JPEG comprimido (lado ≤ 1600, q 0.85) en `t_<uuid>.photos.data_url` y `record_evidence`.
Eso no escala. El siguiente paso de storage es **R2 + metadata en Postgres**, no D1.

## Pagos

Paywall desactivado a propósito (commit `0783e37`). Hay Luhn/marca en frontend (`src/lib/billing.ts`). Cuando se reactive, la confirmación tiene que ser webhook del proveedor → servidor → `subscription status`. No confiar en el cliente.

## Lo que este commit aporta

- Documentación de la decisión
- `.env.example` (nombres, cero secretos)
- CI GitHub Actions (lint / test / typecheck)
- Middleware `/healthz` + cabeceras de seguridad
- `wrangler.toml` **explícitamente no desplegable** hasta Hyperdrive
- `trustedOrigins` de producción (`inspectamx.com`)
