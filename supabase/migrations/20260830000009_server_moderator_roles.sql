create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not coalesce((select suspended from public.account_roles where user_id = public.current_clerk_user_id()), false)
    and exists (
      select 1 from public.account_roles
      where user_id = public.current_clerk_user_id()
        and role = 'moderator'
        and not suspended
    );
$$;
