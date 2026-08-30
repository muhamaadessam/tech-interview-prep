-- Keep the initial seed idempotent while preserving append-only locale rows.
create or replace function public.prevent_published_locale_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    raise exception 'Question locale rows are append-only';
  end if;
  return new;
end;
$$;
