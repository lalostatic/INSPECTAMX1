# INSPECTAMX

**Crea, ejecuta, supervisa y documenta cualquier proceso de inspección desde un solo lugar.**

Producción: **https://inspectamx.com**

Motor de plantillas para inspecciones, auditorías y levantamientos. Cada empresa arma su propio proceso (contenedor, vehículo, almacén, seguridad, calidad…) sin una versión distinta de código. La operación de patio (mapa de unidad, M&R y pintura) sigue disponible como plantilla y módulos.

Cada empresa opera en su propio esquema de base (`t_<uuid>`). Los datos no se mezclan.

## Qué incluye

- Plantillas y constructor de formularios (texto, número, foto, firma, GPS, video, documento…)
- Incidencias (daño, falla, no conformidad, riesgo, observación…)
- Evidencias, geolocalización, firmas y modo sin red
- Estados configurables, tareas asignadas, puntaje y automatizaciones
- Sucursales, activos con historial, etiquetas y buscador
- Dashboard de indicadores a elección del administrador
- Patio: mapa de contenedor, M&R y almacén / pintura
- Panel superadmin (`/super`) para empresas, usuarios, planes y soporte

## Cómo funciona

### 1. Dónde se guardan las inspecciones
En Postgres, en el esquema de la empresa:

- Folios de plantilla: `t_<uuid>.records` (respuestas, incidencias, evidencias, historial)
- Mapa de contenedor: `t_<uuid>.inspections` + `findings`

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
| `public/inspect/` | Fotos del mapa de puntos |

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
