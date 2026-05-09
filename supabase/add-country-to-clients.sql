alter table if exists public.clients
  add column if not exists country text;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where tablename = 'clients' and indexname = 'idx_clients_country'
  ) then
    create index idx_clients_country on public.clients (country);
  end if;
end $$;
