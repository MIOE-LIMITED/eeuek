-- =====================================================================
--  Soyağacım — Supabase şeması
--  Supabase panelinde: SQL Editor > New query > bu dosyayı yapıştırıp çalıştırın.
--  (Storage bucket'ı da aşağıdaki son blok oluşturur.)
-- =====================================================================

-- ---- Profiller -------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'member',   -- 'member' | 'admin'
  status      text not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at  timestamptz not null default now()
);

-- ---- Kişiler (soyağacı) ---------------------------------------------
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  gender      text,
  living      text default 'yes',
  birth_date  text,
  death_date  text,
  birth_place text,
  photo       text,
  notes       text,
  parents     jsonb default '[]',
  spouses     jsonb default '[]',
  created_at  timestamptz not null default now()
);

-- ---- Albümler --------------------------------------------------------
create table if not exists public.albums (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ---- Fotoğraflar -----------------------------------------------------
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid not null references auth.users(id) on delete cascade,
  album_id     uuid references public.albums(id) on delete cascade,
  url          text not null,
  storage_path text,
  caption      text,
  created_at   timestamptz not null default now()
);

-- ---- Yardımcı fonksiyonlar ------------------------------------------
create or replace function public.is_approved()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles
                where id = auth.uid() and status = 'approved');
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles
                where id = auth.uid() and role = 'admin' and status = 'approved');
$$;

-- ---- Yeni kullanıcı kaydında profil oluştur -------------------------
-- İlk kaydolan kişi otomatik yönetici + onaylı olur.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare first_user boolean;
begin
  select count(*) = 0 into first_user from public.profiles;
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when first_user then 'admin'  else 'member'  end,
    case when first_user then 'approved' else 'pending' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- RLS -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.people   enable row level security;
alter table public.albums   enable row level security;
alter table public.photos   enable row level security;

-- profiles: herkes kendi profilini görür/günceller; yönetici hepsini görür/günceller
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- people / albums / photos: yalnızca sahibi ve onaylıysa (kişiye özel)
drop policy if exists "people_owner_all" on public.people;
create policy "people_owner_all" on public.people
  for all using (owner = auth.uid() and public.is_approved())
  with check (owner = auth.uid() and public.is_approved());

drop policy if exists "albums_owner_all" on public.albums;
create policy "albums_owner_all" on public.albums
  for all using (owner = auth.uid() and public.is_approved())
  with check (owner = auth.uid() and public.is_approved());

drop policy if exists "photos_owner_all" on public.photos;
create policy "photos_owner_all" on public.photos
  for all using (owner = auth.uid() and public.is_approved())
  with check (owner = auth.uid() and public.is_approved());

-- ---- Storage: 'photos' bucket ---------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Yükleme/okuma: onaylı kullanıcı yalnızca kendi klasörüne (uid/...) yazar
drop policy if exists "photos_upload_own" on storage.objects;
create policy "photos_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and public.is_approved()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_delete_own" on storage.objects;
create policy "photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Bucket public olduğundan okuma herkese açıktır (URL'i bilen görür).
-- Dilerseniz public'i kapatıp imzalı URL kullanabilirsiniz.
