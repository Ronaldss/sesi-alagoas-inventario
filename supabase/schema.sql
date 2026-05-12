create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('Supervisor', 'Colaborador')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  category text not null,
  location text not null,
  condition text not null check (condition in ('Excelente', 'Bom', 'Regular', 'Requer manutencao')),
  acquisition_date date not null,
  notes text,
  image_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.inventory_items
drop constraint if exists inventory_items_category_check;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Colaborador')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row
execute procedure public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.inventory_items enable row level security;

create policy "authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "users manage own profile"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "authenticated users can read inventory"
on public.inventory_items
for select
to authenticated
using (true);

create policy "authenticated users can insert inventory"
on public.inventory_items
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "supervisors or item owners can update inventory"
on public.inventory_items
for update
to authenticated
using (
  auth.uid() = created_by
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'Supervisor'
  )
)
with check (
  auth.uid() = created_by
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'Supervisor'
  )
);

create policy "only supervisors can delete inventory"
on public.inventory_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'Supervisor'
  )
);

insert into storage.buckets (id, name, public)
values ('inventory-images', 'inventory-images', false)
on conflict (id) do nothing;

create policy "authenticated users can upload inventory images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'inventory-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "authenticated users can read inventory images"
on storage.objects
for select
to authenticated
using (bucket_id = 'inventory-images');

create policy "users manage own inventory images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'inventory-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'inventory-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "supervisors manage all inventory images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'inventory-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'Supervisor'
  )
)
with check (
  bucket_id = 'inventory-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'Supervisor'
  )
);
