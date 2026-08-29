# Despliegue INSPECTAMX

## Estado al 2026-08-29

- `inspectamx.com` no tiene DNS.
- `inspectamx.lalostatic.workers.dev` responde 500. El Worker está sirviendo un bundle Nitro con preset `vercel` y dependencias Node (`pg`, PGLite). Eso no es un runtime Cloudflare válido.
- El DEMO estático en GitHub Pages sí responde.
- Cloudflare Pages con `npm run build` falló (22:44 UTC) por ENOENT `package.json`: el proyecto estaba construyendo un árbol sin ese archivo (rama `gh-pages`) o la raíz incorrecta. Ver `docs/CLOUDFLARE-PAGES.md`.

## Origen recomendado (producción real)

1. Crear proyecto en Vercel (o Fly/Railway). El `vite.config.ts` ya usa `nitro({ preset: "vercel" })`.
2. Crear base Neon (Postgres 16). Copiar el connection string **pooled**.
3. Configurar secretos en el origen (nunca en el repo):

| Variable | Tipo |
|---|---|
| `DATABASE_URL` | secreta |
| `BETTER_AUTH_SECRET` | secreta (≥32 bytes) |
| `BETTER_AUTH_URL` | pública (`https://inspectamx.com`) |
| `VITE_AUTH_ENABLED` | pública (`true`) |

4. `npm run build` aplica `migrations/*.sql` contra Neon (`scripts/migrate.mjs`) **salvo** cuando `CF_PAGES=1`.
5. Los schemas `t_<uuid>` se crean al primer uso de cada empresa (`ensureOrgTenant`).
6. En Cloudflare Registrar/DNS:
   - A/AAAA o CNAME del origen Node
   - SSL Full (strict)
   - WAF managed rules
   - no proxificar el endpoint Postgres

## Comandos

```bash
npm install
npm run lint
npm test
npm run typecheck
npm run build          # Vite + migraciones si hay DATABASE_URL
npm run build:pages    # folleto estático docs/ → dist/ (lo que Pages debe publicar)
npm run dev            # http://0.0.0.0:8080
```

Migración sola:

```bash
DATABASE_URL='postgresql://…' npm run db:migrate
```

## Cloudflare Pages (folleto, no la app)

Dashboard → Settings → Builds:

- Production branch: `main`
- Root directory: (vacío)
- Build command: `npm run build`
- Output directory: `dist`

Con `CF_PAGES=1` el wrapper publica `docs/` y no toca Postgres.

Detalle: [CLOUDFLARE-PAGES.md](CLOUDFLARE-PAGES.md).

## Cloudflare Workers (no usar todavía)

`wrangler.toml` existe para dejar constancia del nombre del Worker y bloquear un deploy accidental.

Para un futuro intento real haría falta, en este orden:

1. `NITRO_PRESET=cloudflare_module` en el build
2. `compatibility_flags = ["nodejs_compat"]`
3. Neon Hyperdrive binding (TCP Postgres desde el isolate)
4. Eliminar PGLite del grafo de producción
5. Secretos `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` vía `wrangler secret`
6. Probar `/healthz` → 200 **antes** de apuntar el dominio

Hasta entonces: `npx wrangler deploy` del artefacto actual reproduce el 500.

## GitHub Pages (DEMO)

La carpeta `DEMO/` / `docs/` es estática. No es la app. No espera login real ni Postgres.
