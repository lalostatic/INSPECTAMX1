# INSPECTAMX

Patio de contenedores y chasis: inspección con mapa de puntos, taller M&R y pintura.

**Marca:** INSPECTAMX  
**Demo visual (clientes):** [lalostatic.github.io/INSPECTA-1.2](https://lalostatic.github.io/INSPECTA-1.2/)  
**Código:** [github.com/lalostatic/INSPECTAMX](https://github.com/lalostatic/INSPECTAMX)

Cada empresa opera en su propio esquema Postgres (`t_<uuid>`). Los datos no se mezclan.  
No hay alta pública. Un patio por empresa.

`inspectamx.com` todavía **no tiene DNS**. El patio de producción es Node + Neon, no el Worker.

---

## Estructura del repo

```
README.md
package.json
tsconfig.json
.github/workflows/deploy-pages.yml
cloudflare/
  wrangler.toml
  workers/
    api/
      src/index.ts
      package.json
pages/
  src/index.tsx
  package.json
src/                    patio TanStack Start (login, /chasis, Postgres)
server/                 middleware del patio
```

| Ruta | Qué es |
|---|---|
| `pages/` | Folleto público (Vite, `base: "./"`) |
| `cloudflare/workers/api` | Worker: `ASSETS` + `/api/health`. No corre `pg` |
| `src/` | Producto. No se partió en frontend/backend sueltos |

---

## Qué es el producto

El inspector toca el punto en el mapa, toma la foto y cierra el folio. El trabajo del día lo marca el **ingreso al patio**.

1. Ingreso — contenedores y chasis.
2. Inspección — mapa + foto.
3. Taller M&R — ~12 unidades/día de referencia.
4. Pintura — 5–7 contenedores/día.
5. Cierre — folio y firma.

Ruta de chasis: `/chasis` en el patio (`src/routes/chasis.tsx`).

---

## Acceso (solo el patio, no Pages)

Sin registro público. `/login` con correo de la empresa.

Cuentas demo (contraseña `Muelle2026`), solo semilla local:

| Rol | Correo |
|---|---|
| Superadmin | `desarrollo@inspectamx.com` |
| Cerlan | `admin@cerlan.mx` |

---

## Comandos

```bash
npm install
npm run dev                 # patio local :8080
npm run dev:pages           # folleto Vite
npm run build:pages         # pages/dist (rutas relativas)
npm run deploy:site         # build pages + wrangler (cloudflare/)
npm run lint && npm test && npm run typecheck
```

GitHub Actions: `.github/workflows/deploy-pages.yml` publica `pages/dist`.
En el repo, Settings → Pages → Source = GitHub Actions.

Worker:

```bash
npm run deploy:site
# GET /api/health → { ok: true, service: "inspectamx-api" }
```

---

## Qué ya no aplica

- D1 como base del patio.
- Workers como runtime de login/`/chasis`.
- Alta pública.
- Tratar INSPECTA 1.2 como nombre del producto (solo URL de demo).

Detalle: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DEPLOY.md](docs/DEPLOY.md).
