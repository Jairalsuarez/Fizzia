-- Let projects be deleted without losing payment history.
-- Run in Supabase > SQL Editor.

alter table public.payments
  drop constraint if exists payments_project_id_fkey;

alter table public.payments
  add constraint payments_project_id_fkey
  foreign key (project_id)
  references public.projects(id)
  on delete set null;
