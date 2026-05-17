drop policy if exists "users can read inventory images in linked units" on storage.objects;
drop policy if exists "users manage own inventory images in linked units" on storage.objects;
drop policy if exists "admins and supervisors delete inventory images in linked units" on storage.objects;

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
        i.created_by = auth.uid()
        or public.user_role() in ('Administrador', 'Supervisor')
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
        i.created_by = auth.uid()
        or public.user_role() in ('Administrador', 'Supervisor')
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
