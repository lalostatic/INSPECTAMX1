# INSPECTAMX

Patio de contenedores y chasis: inspección con mapa de puntos, taller M&R y pintura.

**Marca:** INSPECTAMX  
**Demo visual (clientes):** [lalostatic.github.io/INSPECTA-1.2](https://lalostatic.github.io/INSPECTA-1.2/)  
**Código:** [github.com/lalostatic/INSPECTAMX](https://github.com/lalostatic/INSPECTAMX)

Cada empresa opera en su propio esquema Postgres (`t_<uuid>`). Los datos no se mezclan.  
No hay alta pública. El administrador da de alta a su gente con correo y contraseña. Un patio por empresa.

`inspectamx.com` es el dominio del producto. Hoy **no tiene DNS**; el origen de producción es un servidor Node + Neon, no Cloudflare Workers.

---

## Qué es el producto

El inspector toca el punto en el mapa, toma la foto y cierra el folio. El trabajo del día lo marca el **ingreso al patio** (gate-in), no un pipeline fijo de principio a fin.

1. **Ingreso** — llegan contenedores y chasis; se registran.
2. **Inspección** — mapa de puntos + foto. El daño es opcional.
3. **Taller M&R** — backlog del día (~12 contenedores o chasis/día de referencia).
4. **Pintura / acondicionado** — cupo del día (5–7 contenedores/día de referencia).
5. **Cierre** — firmas, folio y reporte; salida o stack.

| Unidad | Vistas | Comportamiento |
|---|---|---|
| Contenedor | Puertas, interior, lateral izq./der. | Toque → cámara |
| Chasis | Plano técnico: elevación, planta, frente, trasera | Toque → cámara |

Ruta de chasis: `/chasis`.  
Código: `src/components/container-map.tsx`, `src/components/chassis-map.tsx`.

También hay plantillas de formulario (seguridad, almacén, vehículo), foto, firma, GPS, folios, roles (admin, oficina, inspector, taller, pintura, consulta) y panel superadmin en `/super`.

---

## Acceso

Sin registro público. Entrada en `/login` con el correo de la empresa.

Cuentas demo (contraseña `Muelle2026`), solo en entorno de desarrollo / semilla:

| Rol | Correo |
|---|---|
| Superadmin | `desarrollo@inspectamx.com` |
| Cerlan (activa) | `admin@cerlan.mx` |
| Contri | `admin@contri.mx` |
| Istmo | `admin@istmo.mx` |

El inspector solo ve sus folios. Admin y oficina ven el patio propio, nunca el de otra empresa.

---

## Cambios hechos (agosto 2026)

Producto

- Mapa de **chasis** sobre plano técnico. No es inspección de vehículo.
- Plantilla `chassis_map` también se agrega a patios que ya tenían semilla.
- Flujo documentado por **ingreso diario**, no por un pipeline rígido.
- Capacidades de referencia de patio publicadas (pintura 5–7, M&R ~12).
- Arranque asíncrono: el login aparece de inmediato; la semilla demo corre en segundo plano.

Arquitectura (lo que se decidió y se dejó por escrito)

- El producto **ya es multi-tenant**. No se reescribió a Cloudflare D1: D1 es SQLite y rompe el esquema por empresa, Better Auth, Kysely y `pg`.
- Cloudflare Workers **no es el runtime de producción**. El 500 en `inspectamx.lalostatic.workers.dev` (`HTTPError`) viene de servir un bundle Nitro con preset `vercel` + import estático de `pg` / PGLite en un isolate.
- Runtime correcto: **Node + Neon Postgres**. Cloudflare queda para DNS, SSL, WAF y CDN cuando el dominio exista.
- R2 para fotos queda para un ciclo siguiente (hoy JPEG comprimido en Postgres, lado máx. 1600 px).
- `wrangler.toml` existe como marca de “no desplegar todavía”, no como receta de producción.

Operación del repo

- `docs/ARCHITECTURE.md` — decisión y mapa del sistema.
- `docs/DEPLOY.md` — cómo levantar el origen Node.
- `.env.example` — nombres de variables, cero secretos.
- CI: lint / test / typecheck / build.
- Middleware `/healthz` y cabeceras de seguridad.
- `trustedOrigins` incluye los dominios de producción previstos.
- Folleto estático en `docs/` y `DEMO/`. El sitio que se muestra a clientes es GitHub Pages de **INSPECTA-1.2** (la URL ya circula).

---

## Qué ya no aplica

No está vigente, no se documenta como camino actual y no hay que retomarlo en este ciclo:

- Migrar la base a **D1** o reescribir el aislamiento como `tenant_id` en SQLite.
- Tomar **Workers / workers.dev** como el patio en producción.
- **Alta pública** o “crear cuenta” en internet.
- Un pipeline fijo inspección → M&R → pintura independiente de lo que entra al patio.
- Tratar **INSPECTA 1.2** como el nombre del producto. El producto se llama **INSPECTAMX**. Esa URL de Pages se conserva porque ya se comparte con clientes.
- Presentar `inspectamx.com` como si ya resolviera. El DNS todavía no está.
- Paywall activo. El cobro está desactivado a propósito; no se vende desde el cliente.

Detalle técnico: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) y [docs/DEPLOY.md](docs/DEPLOY.md).

---

## Cómo está guardado

- Folios de plantilla: `t_<uuid>.records`
- Mapa de contenedor / chasis: `t_<uuid>.inspections` + hallazgos y fotos
- Fotos en JPEG comprimido (lado máx. 1600 px)

---

## Desarrollo

```bash
npm install
npm run dev
```

Stack: TanStack Start, React 19, Vite, Postgres (Neon) o PGLite en local.

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

GitHub Pages **no** corre el patio con login y cámara. Eso vive en el servidor Node con Postgres.
