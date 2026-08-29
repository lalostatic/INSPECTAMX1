# INSPECTAMX

**Crea, ejecuta, supervisa y documenta cualquier proceso de inspección desde un solo lugar.**

Producto: [inspectamx.com](https://inspectamx.com)  
Demo visual (para clientes): [lalostatic.github.io/INSPECTA-1.2](https://lalostatic.github.io/INSPECTA-1.2/)  
Código: [github.com/lalostatic/INSPECTAMX](https://github.com/lalostatic/INSPECTAMX)

Patio de contenedores y chasis: inspección con mapa de puntos, taller M&R y pintura. Cada empresa opera en su propio esquema Postgres (`t_<uuid>`). Los datos no se mezclan.

No hay alta pública. El administrador da de alta a su gente con correo y contraseña. Un solo patio por empresa.

## Qué hay de nuevo

- **Inspección de chasis** con mapa de puntos sobre plano técnico (elevación, planta, frente y trasera). No es inspección de vehículo: se toca el punto en el dibujo y se abre la cámara.
- **Inspección de contenedor** con el mismo patrón (puertas, interior, laterales).
- El trabajo del día lo marca el **ingreso al patio** (gate-in), no un pipeline fijo.
- Capacidad de referencia: pintura **5–7 contenedores/día**, taller M&R **~12 contenedores o chasis/día**.
- Arranque asíncrono: el login aparece de inmediato; la semilla demo corre en segundo plano.
- Plantilla `chassis_map` se agrega también a patios que ya tenían semilla.

## Flujo de patio

1. **Ingreso** — llegan contenedores y chasis; se registran.
2. **Inspección** — mapa de puntos + foto. El daño es opcional.
3. **Taller M&R** — se atiende el backlog del día.
4. **Pintura / acondicionado** — cupo del día.
5. **Cierre** — firmas, folio y reporte; salida o stack.

## Qué incluye

- Plantillas (contenedor, chasis, formularios de seguridad / almacén / vehículo)
- Foto, firma, GPS, incidencias y modo sin red
- Folios, tareas, puntaje y automatizaciones
- M&R y almacén / pintura
- Equipo por roles (admin, oficina, inspector, taller, pintura, consulta)
- Panel superadmin en `/super`

## Mapa de puntos

| Unidad | Vistas | Comportamiento |
|---|---|---|
| Contenedor | Puertas, interior, lateral izq./der. | Toque → cámara |
| Chasis | Plano técnico, lateral, superior, frente, trasera | Toque → cámara |

Ruta de chasis: `/chasis`. Código: `src/components/container-map.tsx`, `src/components/chassis-map.tsx`.

## Acceso

Sin registro público. Entrada en `/login` con el correo de la empresa.

Cuentas demo (contraseña `Muelle2026`):

| Rol | Correo |
|---|---|
| Superadmin | `desarrollo@inspectamx.com` |
| Cerlan (activa) | `admin@cerlan.mx` |
| Contri | `admin@contri.mx` |
| Istmo | `admin@istmo.mx` |

## Cómo está guardado

- Folios de plantilla: `t_<uuid>.records`
- Mapa de contenedor / chasis: `t_<uuid>.inspections` + hallazgos y fotos
- Fotos en JPEG comprimido (lado máx. 1600 px)

El inspector solo ve sus folios. Admin y oficina ven el patio propio, nunca el de otra empresa.

## Desarrollo

```bash
npm install
npm run dev
```

Stack: TanStack Start, React 19, Vite, Postgres (Neon) o PGLite en local.

La carpeta `DEMO/` y `docs/` son el folleto estático. GitHub Pages **no** corre el patio con login y cámara; eso vive en el servidor con Postgres.
