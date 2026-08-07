-- 1. Crie primeiro o usuario no Supabase Auth com o e-mail desejado.
-- 2. Depois execute este SQL para transformar o acesso em somente leitura.
-- 3. Substitua os valores abaixo antes de rodar.

with target_user as (
  select id
  from auth.users
  where email = 'auditoria@sesi-al.edu.br'
),
target_unit as (
  select id
  from public.units
  where code = '001'
)
update public.profiles
set
  full_name = 'Auditoria',
  email = 'auditoria@sesi-al.edu.br',
  role = 'Visualizacao',
  last_unit_id = (select id from target_unit)
where id = (select id from target_user);

with target_user as (
  select id
  from auth.users
  where email = 'auditoria@sesi-al.edu.br'
),
target_unit as (
  select id
  from public.units
  where code = '001'
)
insert into public.profile_units (profile_id, unit_id)
select
  (select id from target_user),
  (select id from target_unit)
where exists (select 1 from target_user)
  and exists (select 1 from target_unit)
on conflict (profile_id, unit_id) do nothing;
