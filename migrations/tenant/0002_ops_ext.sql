-- INSPECTAMX — extensión operativa por patio.
-- Cada empresa tiene su propio esquema (t_<uuid>). Estas tablas NUNCA se mezclan entre patios.
-- Al actualizar el sistema: solo se agregan columnas/tablas (nunca se borran datos).

-- 5. Recuperar inspecciones: no se borran, se archivan.
alter table __SCHEMA__.inspections add column if not exists archived_at timestamptz;

-- 8/notificaciones: SMTP de ESTA empresa. No usar un SMTP global.
create table if not exists __SCHEMA__.smtp_settings (
  id           text primary key default 'default',
  host         text not null default '',
  port         integer not null default 587,
  username     text not null default '',
  password     text not null default '',
  from_email   text not null default '',
  from_name    text not null default '',
  secure       boolean not null default false,
  updated_at   timestamptz not null default now()
);

insert into __SCHEMA__.smtp_settings (id)
values ('default')
on conflict (id) do nothing;

-- 6. Historial de respaldos descargados (el archivo lo guarda el administrador).
create table if not exists __SCHEMA__.backup_events (
  id           text primary key,
  created_by   text not null,
  kind         text not null default 'export',
  note         text not null default '',
  created_at   timestamptz not null default now()
);
