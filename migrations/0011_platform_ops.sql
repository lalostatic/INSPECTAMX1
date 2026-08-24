-- Superadmin: baja de usuarios y logo de empresa (texto/URL, sin binario).
alter table organizations add column if not exists logo_url text not null default '';
alter table org_members add column if not exists blocked boolean not null default false;
