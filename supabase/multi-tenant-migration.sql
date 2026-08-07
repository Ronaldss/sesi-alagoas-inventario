create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists units_set_updated_at on public.units;
create trigger units_set_updated_at
before update on public.units
for each row
execute procedure public.set_updated_at();

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('Administrador', 'Supervisor', 'Colaborador', 'Visualizacao'));

alter table public.profiles
add column if not exists last_unit_id uuid references public.units(id) on delete set null;

create table if not exists public.profile_units (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, unit_id)
);

create index if not exists idx_profile_units_profile_id on public.profile_units(profile_id);
create index if not exists idx_profile_units_unit_id on public.profile_units(unit_id);

insert into public.units (code, description)
values ('001', 'SESI 001')
on conflict (code) do nothing;

alter table public.inventory_items
add column if not exists unit_id uuid references public.units(id) on delete restrict;

update public.inventory_items
set unit_id = (
  select id
  from public.units
  where code = '001'
)
where unit_id is null;

insert into public.profile_units (profile_id, unit_id)
select
  p.id,
  u.id
from public.profiles p
cross join public.units u
where u.code = '001'
on conflict (profile_id, unit_id) do nothing;

update public.profiles
set last_unit_id = (
  select id
  from public.units
  where code = '001'
)
where last_unit_id is null;

alter table public.inventory_items
alter column unit_id set not null;

create index if not exists idx_inventory_items_unit_id on public.inventory_items(unit_id);
create index if not exists idx_inventory_items_created_by on public.inventory_items(created_by);

create or replace function public.user_has_unit_access(target_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_units pu
    where pu.profile_id = auth.uid()
      and pu.unit_id = target_unit_id
  );
$$;

create or replace function public.user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

alter table public.units enable row level security;
alter table public.profile_units enable row level security;

drop policy if exists "authenticated users can read inventory" on public.inventory_items;
drop policy if exists "authenticated users can insert inventory" on public.inventory_items;
drop policy if exists "supervisors or item owners can update inventory" on public.inventory_items;
drop policy if exists "only supervisors can delete inventory" on public.inventory_items;

create policy "users can read inventory from linked units"
on public.inventory_items
for select
to authenticated
using (public.user_has_unit_access(unit_id));

create policy "users can insert inventory in linked units"
on public.inventory_items
for insert
to authenticated
with check (
  auth.uid() = created_by
  and public.user_has_unit_access(unit_id)
  and public.user_role() in ('Administrador', 'Supervisor', 'Colaborador')
);

create policy "supervisors or owners update inventory in linked units"
on public.inventory_items
for update
to authenticated
using (
  public.user_has_unit_access(unit_id)
  and (
    public.user_role() in ('Administrador', 'Supervisor')
    or (public.user_role() = 'Colaborador' and auth.uid() = created_by)
  )
)
with check (
  public.user_has_unit_access(unit_id)
  and (
    public.user_role() in ('Administrador', 'Supervisor')
    or (public.user_role() = 'Colaborador' and auth.uid() = created_by)
  )
);

create policy "admins and supervisors delete inventory in linked units"
on public.inventory_items
for delete
to authenticated
using (
  public.user_has_unit_access(unit_id)
  and public.user_role() in ('Administrador', 'Supervisor')
);

drop policy if exists "authenticated users can read profiles" on public.profiles;
drop policy if exists "users manage own profile" on public.profiles;

create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.user_role() = 'Administrador');

drop policy if exists "admins can manage units" on public.units;
drop policy if exists "users can read linked units" on public.units;

create policy "admins can manage units"
on public.units
for all
to authenticated
using (public.user_role() = 'Administrador')
with check (public.user_role() = 'Administrador');

create policy "users can read linked units"
on public.units
for select
to authenticated
using (public.user_has_unit_access(id));

drop policy if exists "users can read own unit links" on public.profile_units;
drop policy if exists "admins manage unit links" on public.profile_units;

create policy "users can read own unit links"
on public.profile_units
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.user_role() = 'Administrador'
);

create policy "admins manage unit links"
on public.profile_units
for all
to authenticated
using (public.user_role() = 'Administrador')
with check (public.user_role() = 'Administrador');

drop policy if exists "authenticated users can upload inventory images" on storage.objects;
drop policy if exists "authenticated users can read inventory images" on storage.objects;
drop policy if exists "users manage own inventory images" on storage.objects;
drop policy if exists "supervisors manage all inventory images" on storage.objects;

create policy "users can upload inventory images in linked units"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'inventory-images'
  and public.user_has_unit_access((storage.foldername(name))[1]::uuid)
  and auth.uid()::text = (storage.foldername(name))[2]
  and public.user_role() in ('Administrador', 'Supervisor', 'Colaborador')
);

create policy "users can read inventory images in linked units"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'inventory-images'
  and exists (
    select 1
    from public.inventory_items i
    where i.image_path = storage.objects.name
      and public.user_has_unit_access(i.unit_id)
  )
);

create policy "users manage own inventory images in linked units"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'inventory-images'
  and exists (
    select 1
    from public.inventory_items i
    where i.image_path = storage.objects.name
      and public.user_has_unit_access(i.unit_id)
      and (
        public.user_role() in ('Administrador', 'Supervisor')
        or (public.user_role() = 'Colaborador' and i.created_by = auth.uid())
      )
  )
)
with check (
  bucket_id = 'inventory-images'
  and exists (
    select 1
    from public.inventory_items i
    where i.image_path = storage.objects.name
      and public.user_has_unit_access(i.unit_id)
      and (
        public.user_role() in ('Administrador', 'Supervisor')
        or (public.user_role() = 'Colaborador' and i.created_by = auth.uid())
      )
  )
);

create policy "admins and supervisors delete inventory images in linked units"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'inventory-images'
  and exists (
    select 1
    from public.inventory_items i
    where i.image_path = storage.objects.name
      and public.user_has_unit_access(i.unit_id)
      and public.user_role() in ('Administrador', 'Supervisor')
  )
);
