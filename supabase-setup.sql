-- FormalízatePE · configuración adicional para persistencia
-- Ejecutar en Supabase SQL Editor después de crear profiles, etapas_usuario y requisitos_usuario.

-- Reforzar políticas RLS con WITH CHECK (evita insertar/actualizar filas ajenas).
drop policy if exists "Permitir lectura y escritura al propio usuario" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Usuarios gestionan sus etapas" on public.etapas_usuario;
create policy "etapas_usuario_own" on public.etapas_usuario for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuarios gestionan sus requisitos" on public.requisitos_usuario;
create policy "requisitos_usuario_own" on public.requisitos_usuario for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Perfil: el trigger de auth.users debe crear el perfil. Esta tabla debe tener RLS habilitado.
alter table public.profiles enable row level security;
alter table public.etapas_usuario enable row level security;
alter table public.requisitos_usuario enable row level security;

-- Metadatos de documentos. Los archivos binarios se guardan en Storage, no en esta tabla.
create table if not exists public.documentos_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage_id text not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
alter table public.documentos_usuario enable row level security;
drop policy if exists "documentos_usuario_own" on public.documentos_usuario;
create policy "documentos_usuario_own" on public.documentos_usuario for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bucket privado de hasta 10 MB; solo PDF, JPG y PNG.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('documentos','documentos',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf','image/jpeg','image/png'];

drop policy if exists "documentos_storage_insert_own" on storage.objects;
create policy "documentos_storage_insert_own" on storage.objects for insert to authenticated
with check (bucket_id='documentos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "documentos_storage_select_own" on storage.objects;
create policy "documentos_storage_select_own" on storage.objects for select to authenticated
using (bucket_id='documentos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "documentos_storage_delete_own" on storage.objects;
create policy "documentos_storage_delete_own" on storage.objects for delete to authenticated
using (bucket_id='documentos' and (storage.foldername(name))[1]=auth.uid()::text);

-- Asegurar creación automática del perfil al registrar una cuenta nueva.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre_mype)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Mi Bodega Pro')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
