alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('Administrador', 'Supervisor', 'Colaborador', 'Visualizacao'));

drop policy if exists "users can insert inventory in linked units" on public.inventory_items;
drop policy if exists "supervisors or owners update inventory in linked units" on public.inventory_items;
drop policy if exists "admins and supervisors delete inventory in linked units" on public.inventory_items;

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

drop policy if exists "users can upload inventory images in linked units" on storage.objects;
drop policy if exists "users manage own inventory images in linked units" on storage.objects;
drop policy if exists "admins and supervisors delete inventory images in linked units" on storage.objects;

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
