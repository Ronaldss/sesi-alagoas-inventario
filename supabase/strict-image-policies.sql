drop policy if exists "users can upload inventory images in linked units" on storage.objects;
drop policy if exists "users can read inventory images in linked units" on storage.objects;
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
);

create policy "users can read inventory images in linked units"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'inventory-images'
  and public.user_has_unit_access((storage.foldername(name))[1]::uuid)
);

create policy "users manage own inventory images in linked units"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'inventory-images'
  and public.user_has_unit_access((storage.foldername(name))[1]::uuid)
  and auth.uid()::text = (storage.foldername(name))[2]
)
with check (
  bucket_id = 'inventory-images'
  and public.user_has_unit_access((storage.foldername(name))[1]::uuid)
  and auth.uid()::text = (storage.foldername(name))[2]
);

create policy "admins and supervisors delete inventory images in linked units"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'inventory-images'
  and public.user_has_unit_access((storage.foldername(name))[1]::uuid)
  and public.user_role() in ('Administrador', 'Supervisor')
);
