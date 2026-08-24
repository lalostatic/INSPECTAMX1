# INSPECTAMX

Sistema de patio: inspección con mapa y foto, taller M&R y almacén.  
Producción: **https://inspectamx.com**

Cada empresa opera en su propio esquema de base (`t_<uuid>`). Los datos no se mezclan.

## Cómo funciona (los 10 puntos)

### 1. Dónde se guardan las inspecciones
En Postgres, tabla `inspections` del esquema de la empresa: `t_<uuid>.inspections` (más `findings`).  
Código: `src/lib/server/inspections.ts`  
Estructura: `migrations/tenant/0001_operations.sql`

### 2. Dónde se guardan las fotografías
Tabla `t_<uuid>.photos`, columna `data_url` (JPEG).  
Al tomar la foto se comprime un poco **sin cambiar el formato**: JPEG calidad 0.85, lado máximo 1600 px.  
Código: `src/lib/compress-image.ts` (cambiar `MAX_EDGE` y `JPEG_QUALITY`).

### 3. Cómo inicia sesión cada inspector
El administrador lo da de alta en **Equipo** (nombre, correo, contraseña, rol inspector).  
No hay alta pública. Entra en `/login` con ese correo. El dominio (`@empresa.mx`) lo ata a su patio.  
Código: `src/components/login-view.tsx`, `src/lib/server/tenant.ts` (`addTeamUser`).

### 4. Cómo evitar que un inspector vea lo que no debe
Menú según el rol **y** filtro en el servidor: el inspector solo lee `user_id = el suyo`.  
Admin y oficina ven todos los folios de **su** patio, nunca de otra empresa.  
Código: `src/lib/roles.ts`

### 5. Cómo recuperar inspecciones anteriores
No se borran. Se **archivan**. En **Configuración → Folios archivados** se recuperan.  
Código: `archiveInspection` / `restoreInspection` en `src/lib/server/inspections.ts`

### 6. Cómo hacer respaldos
Administrador → **Configuración → Descargar respaldo**. Sale un JSON con inspecciones, fotos, M&R y almacén de ese patio.  
Hágalo **antes de actualizar**. Código: `src/lib/server/backups.ts`

### 7. Cómo generar reportes para administradores
Ruta **`/reportes`**: totales, por inspector y CSV.  
Código: `src/lib/server/reports.ts`

### 8. WhatsApp / Telegram sin pagar API
En cada folio hay botones que abren `wa.me` y `t.me/share` con el texto listo. No hay token ni WhatsApp Business.  
El **correo** sí usa SMTP, pero **el de esa empresa** (no uno global).  
Código: `src/lib/share.ts` y Configuración → SMTP.

### 9. Cómo administrar usuarios
**Equipo**: alta con correo/contraseña/rol. Solo el administrador.  
El correo debe ser del dominio de la empresa.

### 10. Cómo actualizar el sistema sin perder información
Las migraciones **solo agregan** tablas y columnas (`migrations/tenant/`).  
Antes de actualizar: descargue el respaldo JSON. Después, al arrancar, se aplican migraciones pendientes por patio.

## SMTP por empresa

Cada patio guarda host, puerto, usuario y contraseña en `t_<uuid>.smtp_settings`.  
No existe un SMTP compartido. Pantalla: `/configuracion`.

## Carpetas

| Carpeta | Uso |
|---|---|
| `src/` | Sistema |
| `migrations/tenant/` | Estructura de cada patio |
| `DEMO/` | Vista previa estática (GitHub Pages / envío por correo) |
| `public/inspect/` | Fotos del mapa de puntos |

## Desarrollo

```
npm install
npm run dev
```

El servidor queda en el puerto 8080.

## Demo

Abra `DEMO/index.html` o el sitio estático del repositorio.
