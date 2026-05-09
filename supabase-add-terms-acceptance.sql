-- Terms acceptance fields for clients and developers.
-- Run in Supabase > SQL Editor.

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_full_name text,
  add column if not exists terms_version text;
