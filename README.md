# INSPECTAMX

**Crea, ejecuta, supervisa y documenta cualquier proceso de inspección desde un solo lugar.**

Producción: **https://inspectamx.com**

Motor de plantillas para inspecciones, auditorías y levantamientos. Cada empresa arma su propio proceso (contenedor, chasis, vehículo, almacén, seguridad, calidad…) sin una versión distinta de código. La operación de patio (mapa de unidad, M&R y pintura) sigue disponible como plantilla y módulos.

Cada empresa opera en su propio esquema de base (`t_<uuid>`). Los datos no se mezclan.

## Flujo de patio (ingreso diario)

El trabajo **no** sigue un pipeline fijo: depende del **ingreso de contenedores y chasis al patio** (gate-in) de cada día.

1. **Ingreso** — llegan unidades; se registran e inspeccionan (mapa de puntos o plantilla).
2. **Hallazgos** — el inspector marca daños en el mapa (contenedor o chasis) y adjunta foto.
3. **Taller M&R** — reparadores atienden el backlog del día (referencia: **~12 unidades/día** entre contenedores y chasis).
4. **Pintura / acondicionado** — pintores trabajan el cupo del día (referencia: **5 a 7 contenedores/día**).
5. **Cierre** — firmas, folio y reporte; listo para salida o stack.

Capacidad de referencia (orientativa, no un límite del sistema):

| Rol | Unidades / día | Unidad |
|-----|----------------|--------|
| Pintura | 5 – 7 | Contenedores |
| Taller M&R | ~12 | Contenedores o chasis |

## Qué incluye

- Plantillas y constructor de formularios (texto, número, foto, firma, GPS, video, documento…)
- Incidencias (daño, falla, no conformidad, riesgo, observación…)
- Evidencias, geolocalización, firmas y modo sin red
- Estados configurables, tareas asignadas, puntaje y automatizaciones
- Sucursales, activos con historial, etiquetas y buscador
- Dashboard de indicadores a elección del administrador
- Patio: **mapa de contenedor**, **mapa de chasis** (formato de estado), M&R y almacén / pintura
- Panel superadmin (`/super`) para empresas, usuarios, planes y soporte

## Mapa de puntos

### Contenedor
Vistas: puertas, interior, lateral (izquierdo / derecho). Al tocar un punto se abre la cámara. Alineado a la operación de inspección de equipo en patio.

### Chasis
Diagrama superior alineado al **FORMATO DE ESTADO DE CHASIS** (M&R Mex): manitas de aire, seguros, patín, travesaños, carro de ejes, frenos, llantas, mangueras, calaveras, etc. Grupos filtrables; OK o foto por componente.

Código: `src/lib/inspect-points.ts`, `src/lib/chassis-points.ts`, `src/components/container-map.tsx`, `src/components/chassis-map.tsx`.

## Cómo funciona

### 1. Dónde se guardan las inspecciones
En Postgres, en el esquema de la empresa:

- Folios de plantilla: `t_<uuid>.records` (respuestas, incidencias, evidencias, historial)
- Mapa de contenedor / chasis: `t_<uuid>.inspections` + `findings`

Código: `src/lib/server/engine.ts`, `src/lib/server/inspections.ts`  
Estructura: `migrations/tenant/`

### 2. Dónde se guardan las fotografías
Tabla `t_<uuid>.photos` (mapa) y `t_<uuid>.record_evidence` (plantillas), JPEG en `data_url`.  
Al tomar la foto se comprime: JPEG calidad 0.85, lado máximo 1600 px.  
Código: `src/lib/compress-image.ts`

### 3. Cómo inicia sesión cada inspector
El administrador lo da de alta en **Equipo** (nombre, correo, contraseña, rol).  
No hay alta pública. Entra en `/login` con ese correo. El dominio (`@empresa.mx`) lo ata a su empresa.  
Código: `src/components/login-view.tsx`, `src/lib/server/tenant.ts`

### 4. Cómo evitar que un inspector vea lo que no debe
Menú según el rol **y** filtro en el servidor: el inspector solo lee sus folios (`user_id` o tarea asignada).  
Admin y oficina ven todos los folios de **su** empresa, nunca de otra.  
Consulta: solo lectura.  
Código: `src/lib/roles.ts`

### 5. Cómo recuperar inspecciones anteriores
Los folios de mapa no se borran: se **archivan** (Configuración).  
Los de plantilla quedan en historial del folio y del activo.

### 6. Cómo hacer respaldos
Administrador → **Configuración → Descargar respaldo**. JSON de ese patio.  
Hágalo **antes de actualizar**. Código: `src/lib/server/backups.ts`

### 7. Cómo generar reportes
Ruta **`/reportes`** (CSV de patio) y, en cada folio de plantilla, imprimir / PDF / WhatsApp / Telegram.

### 8. WhatsApp / Telegram sin pagar API
En cada folio se abre `wa.me` y `t.me/share`. No hay token ni WhatsApp Business.  
El **correo** usa el SMTP **de esa empresa**.  
Código: `src/lib/share.ts`

### 9. Cómo administrar usuarios
**Equipo**: alta con correo/contraseña/rol. Solo el administrador.  
El correo debe ser del dominio de la empresa.

### 10. Cómo actualizar el sistema sin perder información
Las migraciones **solo agregan** tablas y columnas (`migrations/` y `migrations/tenant/`).  
Antes de actualizar: descargue el respaldo JSON.

## Superadmin

Correo: `desarrollo@inspectamx.com` (también `desarrolo@inspectamx.com`).  
Ruta `/super`: empresas, usuarios, planes, logs, tickets, avisos, catálogos, impersonación.

## SMTP por empresa

Cada patio guarda host, puerto, usuario y contraseña en `t_<uuid>.smtp_settings`.  
No existe un SMTP compartido. Pantalla: `/configuracion`.

## Carpetas

| Carpeta | Uso |
|---|---|
| `src/` | Sistema |
| `migrations/tenant/` | Estructura de cada empresa |
| `DEMO/` | Vista previa estática (GitHub Pages) |
| `public/inspect/` | Fotos del mapa de puntos de contenedor |

## Desarrollo

```
npm install
npm run dev
```

## Demo

Abra `DEMO/index.html` o el sitio estático del repositorio.

Cuentas de demostración (contraseña `Muelle2026`):

- Superadmin: `desarrolo@inspectamx.com`
- Cerlan (activa): `admin@cerlan.mx`
- Contri (vencida): `admin@contri.mx`
- Istmo (prueba): `admin@istmo.mx`

## Arquitectura y producción

La app es **TanStack Start + Nitro (preset Vercel) + Postgres (Neon)**. Cada empresa vive en su schema `t_<uuid>`. No usa Cloudflare D1.

- Arquitectura y decisión D1: `docs/ARCHITECTURE.md`
- Cómo publicar: `docs/DEPLOY.md`
- Variables (solo nombres): `.env.example`

`inspectamx.com` debe apuntar a un origin Node (Vercel/Fly) detrás de Cloudflare DNS/SSL/WAF. El Worker `*.workers.dev` actual no es un runtime válido para este código.

```
npm install
npm run deploy:check
npm run dev
```
