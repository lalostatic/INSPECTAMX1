# INSPECTAMX

Patio de contenedores y chasis: inspección con mapa de puntos, taller M&R y pintura.

**Demo visual:** [lalostatic.github.io/INSPECTA-1.2](https://lalostatic.github.io/INSPECTA-1.2/)  
**Código:** [github.com/lalostatic/INSPECTAMX](https://github.com/lalostatic/INSPECTAMX)

Sin alta pública. Un patio (o varios) por empresa.

Hay **dos capas** en este repo:

1. **Patio** (`src/`) — TanStack Start + Neon/PGLite. Login, `/chasis`, folios.
2. **Cloudflare** (`cloudflare/`, `pages/`) — Worker + D1 + R2 + folleto. Histórico y multi-sucursal a nivel plataforma.

---

## Estructura

```
README.md
package.json
tsconfig.json
.github/workflows/deploy-pages.yml
cloudflare/
  wrangler.toml
  migrations/0001_inspectamx_d1.sql
  workers/api/src/          index.ts, access.ts, types.ts
pages/src/index.tsx
src/                        patio Node
```

---

## D1 (empresas → sucursales → inventario / folios)

`company_id` va en todas las tablas de patio. La empresa agrega sucursales.

```bash
npx wrangler d1 create inspectamx-db
# pegar database_id en cloudflare/wrangler.toml y wrangler.toml
npx wrangler d1 execute inspectamx-db --local --file=cloudflare/migrations/0001_inspectamx_d1.sql
npx wrangler r2 bucket create inspectamx-photos
```

| Actor | Alcance |
|---|---|
| Developer | Global. No opera el folio de patio. |
| Admin empresa | Solo su `company_id`, todas sus sucursales. |
| Inspector | Su empresa + sus folios / sucursal. |

`GET /api/folios/history` aplica ese filtro.  
Cron diario: fotos `hot` con 180 días → `historical` en R2.

Cabeceras provisionales: `x-inspectamx-user`, `x-inspectamx-platform`, `x-inspectamx-company`, `x-inspectamx-branch`, `x-inspectamx-role`.

Detalle: [docs/D1-ACCESS.md](docs/D1-ACCESS.md).

---

## Patio (Node)

```bash
npm install
npm run dev
```

Cuentas demo locales (contraseña `Muelle2026`): `desarrollo@inspectamx.com`, `admin@cerlan.mx`.

---

## Sitio y Worker

```bash
npm run build:pages
npm run deploy:site
```
