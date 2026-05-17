select code, description, is_active
from public.units
order by code;

select
  u.code,
  u.description,
  count(i.id) as total_itens
from public.units u
left join public.inventory_items i on i.unit_id = u.id
group by u.code, u.description
order by u.code;

select
  p.full_name,
  p.role,
  u.code,
  u.description
from public.profile_units pu
join public.profiles p on p.id = pu.profile_id
join public.units u on u.id = pu.unit_id
order by p.full_name, u.code;
