-- Project roadmap and meeting agenda support.

alter table public.appointments
  add column if not exists status text not null default 'scheduled',
  add column if not exists requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists platform text;

create index if not exists idx_appointments_project_starts
  on public.appointments(project_id, starts_at);

create index if not exists idx_appointments_status
  on public.appointments(status, starts_at);

drop policy if exists "Clients can request project meetings" on public.appointments;
create policy "Clients can request project meetings"
on public.appointments for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    join public.client_users cu on cu.client_id = p.client_id
    where p.id = appointments.project_id
    and cu.user_id = auth.uid()
  )
);

drop policy if exists "Clients can read own project meetings" on public.appointments;
create policy "Clients can read own project meetings"
on public.appointments for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    join public.client_users cu on cu.client_id = p.client_id
    where p.id = appointments.project_id
    and cu.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
    and pr.role in ('admin', 'manager')
  )
);
