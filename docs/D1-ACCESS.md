# D1 + R2 en INSPECTAMX

Capa Cloudflare (no sustituye el patio Node + Neon en `src/`).

## Modelo

`company_id` une empresas, sucursales, inventario y folios.
Fotos: objeto en R2, fila en `folio_photos`.

## ACL

Cabeceras provisionales (hasta que el Worker lea la sesión Better Auth):

- `x-inspectamx-user` id numérico
- `x-inspectamx-platform` `developer` | `none`
- `x-inspectamx-company` id empresa
- `x-inspectamx-branch` id sucursal
- `x-inspectamx-role` `company_admin` | `inspector` | …

| Actor | Alcance |
|---|---|
| Developer | Todas las empresas. Archivo de fotos. No opera el folio de patio. |
| Admin empresa | Solo su `company_id`. Inventario y folios de todas sus sucursales. |
| Inspector | Su empresa + (`inspector_user_id = yo` o su `branch_id`). |

## Histórico

`GET /api/folios/history` aplica el `WHERE` de `folioScopeSql`.
Cron `0 6 * * *`: fotos `hot` con `created_at` ≥ 180 días → `historical` y key `hist/`.

## Migrar D1

```bash
npx wrangler d1 create inspectamx-db
# pegar database_id en cloudflare/wrangler.toml
npx wrangler d1 execute inspectamx-db --local --file=cloudflare/migrations/0001_inspectamx_d1.sql
npx wrangler d1 execute inspectamx-db --remote --file=cloudflare/migrations/0001_inspectamx_d1.sql
npx wrangler r2 bucket create inspectamx-photos
```
