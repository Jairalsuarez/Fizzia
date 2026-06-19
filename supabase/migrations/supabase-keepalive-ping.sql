-- Lightweight database ping for scheduled keepalive jobs.
-- It does not read or write application data.

create or replace function public.keepalive_ping()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'checked_at', now()
  );
$$;

revoke all on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon, authenticated;

comment on function public.keepalive_ping()
is 'Safe no-data Supabase keepalive endpoint for scheduled external health checks.';
