-- INSPECTAMX — panel de plataforma (solo superadmin).
-- No forma parte de la base de cada patio.

alter table organizations add column if not exists legal_name text not null default '';
alter table organizations add column if not exists rfc text not null default '';
alter table organizations add column if not exists phone text not null default '';
alter table organizations add column if not exists contact_email text not null default '';
alter table organizations add column if not exists contact_name text not null default '';
alter table organizations add column if not exists address text not null default '';
alter table organizations add column if not exists plan text not null default 'mensual';
alter table organizations add column if not exists max_users integer not null default 25;
alter table organizations add column if not exists max_inspectors integer not null default 10;
alter table organizations add column if not exists storage_mb integer not null default 2048;
alter table organizations add column if not exists status text not null default 'activa';

create table if not exists platform_logs (
  id          text primary key,
  at          timestamptz not null default now(),
  kind        text not null,
  org_id      text,
  user_email  text not null default '',
  message     text not null,
  detail      text not null default ''
);
create index if not exists platform_logs_at_idx on platform_logs (at desc);

create table if not exists platform_errors (
  id       text primary key,
  at       timestamptz not null default now(),
  status   text not null default 'nuevo',
  source   text not null default 'app',
  message  text not null,
  org_id   text
);

create table if not exists platform_notices (
  id          text primary key,
  created_at  timestamptz not null default now(),
  scope       text not null default 'global',
  org_id      text,
  title       text not null,
  body        text not null,
  active      boolean not null default true
);

create table if not exists support_tickets (
  id          text primary key,
  org_id      text not null,
  created_at  timestamptz not null default now(),
  priority    text not null default 'media',
  status      text not null default 'abierto',
  title       text not null,
  body        text not null,
  response    text not null default ''
);

create table if not exists platform_settings (
  key    text primary key,
  value  text not null default ''
);

create table if not exists api_keys (
  id          text primary key,
  name        text not null,
  prefix      text not null,
  created_at  timestamptz not null default now(),
  revoked     boolean not null default false
);

create table if not exists impersonation (
  developer_user_id  text primary key,
  org_id             text not null,
  started_at         timestamptz not null default now()
);

insert into platform_settings (key, value) values
  ('app_name', 'INSPECTAMX'),
  ('domain', 'inspectamx.com'),
  ('timezone', 'America/Mexico_City'),
  ('locale', 'es-MX')
on conflict (key) do nothing;
