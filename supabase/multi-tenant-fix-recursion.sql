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
