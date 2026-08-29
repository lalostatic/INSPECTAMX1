# Cloudflare Pages — por qué falló el build y cómo queda

## El error del log (2026-08-29 22:44 UTC)

```
npm error path /opt/buildhome/repo/package.json
npm error enoent Could not read package.json
Executing user build command: npm run build
Failed
```

Eso no es un bug de Vite ni de `/chasis`. Cloudflare Pages clonó un árbol **sin** `package.json` en la raíz y ejecutó `npm run build`.

Comprobado en el repo:

| Ref | `package.json` en la raíz |
|---|---------------------------|
| `main` | Sí (`inspectamx`, scripts de Vite + migrate) |
| `gh-pages` | No (solo `index.html`, `404.html`, `assets/`) |

La rama `gh-pages` es el sitio estático de GitHub Pages. No es la app.

Causa más probable del log: el proyecto de Cloudflare Pages tiene **Production branch = `gh-pages`** (o un Root directory que no es la raíz de `main`) y **Build command = `npm run build`**.

## Qué hacer en el dashboard (obligatorio)

Cloudflare Dashboard → Workers & Pages → el proyecto → Settings → Builds & deployments:

1. **Production branch:** `main`
   (si dejas `gh-pages`, hay un `package.json` no-op en esa rama; igual no es la app.)
2. **Root directory:** vacío (raíz del repo).
3. **Build command:** `npm run build`
   En Pages el script detecta `CF_PAGES=1` y **no** corre Vite/Nitro/pg. Copia `docs/` → `dist/`.
4. **Build output directory:** `dist`
5. Framework preset: **None** o Vite (output `dist`).

Variables en Pages: ninguna secreta. Este deploy es el folleto, no el patio.

## Qué NO intentar en Pages

- `npm run build` esperando la app con login, `/chasis` y Postgres.
- Apuntar `inspectamx.com` a un Worker con el bundle Nitro `vercel` (`inspectamx.lalostatic.workers.dev` sigue en HTTP 500).
- D1 como base del producto.

La app de producción es **Node + Neon**. Cloudflare aquí es DNS / SSL / WAF / CDN + Pages para el folleto.

## Comprobar

Después de un deploy verde:

- `https://<proyecto>.pages.dev/` debe servir el folleto (`docs/index.html`).
- No esperes `/login` funcional ni mapa de chasis en Pages.
- GitHub Pages de clientes sigue en `https://lalostatic.github.io/INSPECTA-1.2/`.
