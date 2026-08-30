# Monorepo INSPECTAMX

## Por qué no hay `frontend/` + `backend/` separados

La app de patio es **TanStack Start**: las rutas en `src/routes/` mezclan UI React y `createServerFn`. Si se copian a paquetes distintos, el RPC se rompe y el deploy deja de ser una unidad.

La unidad desplegable del patio sigue siendo la raíz (`src/` + `server/` + `vite.config.ts` + `migrations/`).

## Estructura

```
INSPECTAMX/
  package.json          workspaces: apps/*
  src/                  patio (frontend + backend juntos)
  server/               middleware Nitro (healthz, headers)
  public/               SVGs/fotos de inspección (NO ignorar)
  docs/                 folleto estático
  apps/
    worker/             Worker Cloudflare que sirve docs/ vía ASSETS
      src/types.ts      Env { ASSETS: Fetcher }
      src/index.ts      FullEnv extends Env
```

## Cómo se despliega

| Destino | Qué sale |
|---|---|
| `npm run build` en Node (Vercel/Fly) | patio completo |
| `CF_PAGES=1 npm run build` | folleto `docs/` → `dist/` |
| `npx wrangler deploy -c apps/worker/wrangler.toml` | Worker + ASSETS = folleto |

No uses el `wrangler.toml` de la raíz contra `dist/server` (Nitro vercel): eso es el 500 de workers.dev.

## Vite y rutas relativas

`base: "./"` solo si `CF_PAGES=1` o `VITE_RELATIVE_BASE=1`.
En el patio (`/chasis`, `/inspecciones/:id`) `base: "./"` resolvería mal los JS (`/inspecciones/assets/...`). Ahí `base` es `/`.
