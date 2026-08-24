-- INSPECTAMX — motor de plantillas por empresa.
-- Cada patio define sus propios formularios, estados, incidencias y sucursales.

create table if not exists __SCHEMA__.branches (
  id          text primary key,
  name        text not null,
  city        text not null default '',
  address     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists __SCHEMA__.assets (
  id          text primary key,
  branch_id   text not null default '',
  code        text not null default '',
  kind        text not null default 'otro',
  name        text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists assets_code_idx on __SCHEMA__.assets (code);

create table if not exists __SCHEMA__.templates (
  id                text primary key,
  name              text not null,
  description       text not null default '',
  category          text not null default 'Otro',
  kind              text not null default 'form',
  scoring_enabled   boolean not null default true,
  scoring_max       integer not null default 100,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create table if not exists __SCHEMA__.template_fields (
  id           text primary key,
  template_id  text not null,
  sort_order   integer not null default 0,
  type         text not null,
  label        text not null,
  required     boolean not null default false,
  options      text not null default '',
  weight       integer not null default 0,
  help         text not null default ''
);
create index if not exists template_fields_tpl_idx on __SCHEMA__.template_fields (template_id, sort_order);

create table if not exists __SCHEMA__.template_statuses (
  id           text primary key,
  template_id  text not null,
  key          text not null,
  label        text not null,
  color        text not null default 'steel',
  sort_order   integer not null default 0,
  is_initial   boolean not null default false,
  is_final     boolean not null default false
);

create table if not exists __SCHEMA__.incident_types (
  id        text primary key,
  name      text not null,
  severity  text not null default 'media'
);

create table if not exists __SCHEMA__.records (
  id               text primary key,
  folio            integer not null,
  template_id      text not null,
  asset_id         text not null default '',
  branch_id        text not null default '',
  assigned_to      text not null default '',
  assigned_name    text not null default '',
  user_id          text not null,
  inspector_name   text not null default '',
  status           text not null default 'borrador',
  score            integer,
  score_label      text not null default '',
  lat              double precision,
  lng              double precision,
  gps_accuracy     double precision,
  device           text not null default '',
  tags             text not null default '',
  notes            text not null default '',
  priority         text not null default 'media',
  due_at           timestamptz,
  submitted_at     timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists records_at_idx on __SCHEMA__.records (created_at desc);
create index if not exists records_status_idx on __SCHEMA__.records (status);
create index if not exists records_tpl_idx on __SCHEMA__.records (template_id);

create table if not exists __SCHEMA__.record_answers (
  id          text primary key,
  record_id   text not null,
  field_id    text not null,
  value       text not null default ''
);
create index if not exists record_answers_rec_idx on __SCHEMA__.record_answers (record_id);

create table if not exists __SCHEMA__.record_incidents (
  id          text primary key,
  record_id   text not null,
  field_id    text not null default '',
  type_name   text not null,
  severity    text not null default 'media',
  title       text not null default '',
  notes       text not null default '',
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now()
);
create index if not exists record_incidents_rec_idx on __SCHEMA__.record_incidents (record_id);

create table if not exists __SCHEMA__.record_evidence (
  id           text primary key,
  record_id    text not null,
  incident_id  text not null default '',
  kind         text not null default 'photo',
  data_url     text not null default '',
  caption      text not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists record_evidence_rec_idx on __SCHEMA__.record_evidence (record_id);

create table if not exists __SCHEMA__.record_events (
  id          text primary key,
  record_id   text not null,
  at          timestamptz not null default now(),
  actor       text not null default '',
  kind        text not null default 'info',
  message     text not null
);
create index if not exists record_events_rec_idx on __SCHEMA__.record_events (record_id, at);

create table if not exists __SCHEMA__.assignments (
  id              text primary key,
  record_id       text not null default '',
  template_id     text not null default '',
  title           text not null,
  assigned_to     text not null default '',
  assigned_name   text not null default '',
  location_name   text not null default '',
  due_at          timestamptz,
  priority        text not null default 'media',
  status          text not null default 'abierta',
  created_by      text not null default '',
  created_at      timestamptz not null default now()
);
create index if not exists assignments_to_idx on __SCHEMA__.assignments (assigned_to);

create table if not exists __SCHEMA__.automations (
  id           text primary key,
  name         text not null,
  active       boolean not null default true,
  when_event   text not null,
  then_action  text not null,
  template_id  text not null default ''
);

create table if not exists __SCHEMA__.dashboard_prefs (
  id       text primary key default 'default',
  widgets  text not null default 'inspecciones,incidencias,estados,tareas,score,vivos'
);
