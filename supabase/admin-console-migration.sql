alter table public.profiles
add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email is distinct from u.email);

create unique index if not exists idx_profiles_email_lower
on public.profiles (lower(email));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when coalesce(new.raw_user_meta_data->>'role', 'Colaborador') in ('Administrador', 'Supervisor', 'Colaborador', 'Visualizacao')
        then coalesce(new.raw_user_meta_data->>'role', 'Colaborador')
      else 'Colaborador'
    end
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role;

  return new;
end;
$$;

drop policy if exists "admins can update all profiles" on public.profiles;

create policy "admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.user_role() = 'Administrador')
with check (public.user_role() = 'Administrador');
