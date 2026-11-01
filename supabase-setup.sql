-- FormalizatePE · esquema de persistencia Supabase
-- Ejecutar completo en Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre_mype text not null default 'Mi Bodega Pro',
  legal_figure text,
  diagnostic_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists diagnostic_answers jsonb not null default '{}'::jsonb;
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, '')) on conflict (id) do update set email = excluded.email;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.etapas_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage_id text not null, status text not null default 'no-iniciado',
  updated_at timestamptz not null default now(), unique(user_id, stage_id)
);
create table if not exists public.requisitos_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage_id text not null, req_index integer not null, completed boolean not null default false,
  unique(user_id, stage_id, req_index)
);
create table if not exists public.documentos_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage_id text not null, file_name text not null, storage_path text not null unique,
  mime_type text, size_bytes bigint, created_at timestamptz not null default now()
);

alter table public.etapas_usuario enable row level security;
alter table public.requisitos_usuario enable row level security;
alter table public.documentos_usuario enable row level security;
drop policy if exists "etapas_own_all" on public.etapas_usuario;
drop policy if exists "requisitos_own_all" on public.requisitos_usuario;
drop policy if exists "documentos_own_all" on public.documentos_usuario;
create policy "etapas_own_all" on public.etapas_usuario for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "requisitos_own_all" on public.requisitos_usuario for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documentos_own_all" on public.documentos_usuario for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "documentos_storage_insert_own" on storage.objects;
drop policy if exists "documentos_storage_select_own" on storage.objects;
drop policy if exists "documentos_storage_delete_own" on storage.objects;
create policy "documentos_storage_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documentos_storage_select_own" on storage.objects for select to authenticated using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documentos_storage_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);
