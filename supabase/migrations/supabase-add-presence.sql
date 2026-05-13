-- Add real presence tracking for chat/admin.
-- Run this in Supabase > SQL Editor.

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

update public.profiles
set last_seen_at = coalesce(last_seen_at, updated_at, now())
where last_seen_at is null;
