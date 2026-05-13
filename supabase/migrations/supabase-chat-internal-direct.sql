-- Fix internal admin/developer chat and add direct developer-to-developer chat.
-- Run in Supabase > SQL Editor.

alter table public.messages
  add column if not exists recipient_id uuid references auth.users(id) on delete set null;

alter table public.messages
  alter column project_id drop not null;

alter table public.messages
  drop constraint if exists messages_channel_check;

alter table public.messages
  add constraint messages_channel_check
  check (channel in ('client', 'internal', 'direct'));

create index if not exists idx_messages_direct
  on public.messages (channel, sender_id, recipient_id, created_at);

create index if not exists idx_messages_recipient
  on public.messages (recipient_id, created_at);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

drop policy if exists "Users can view messages on their projects" on public.messages;
create policy "Users can view messages on their projects"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role::text in ('admin', 'manager')
    )
    or (
      messages.channel = 'client'
      and exists (
        select 1
        from public.projects pr
        join public.client_users cu on cu.client_id = pr.client_id
        where pr.id = messages.project_id
          and cu.user_id = auth.uid()
      )
    )
    or (
      messages.channel = 'internal'
      and exists (
        select 1
        from public.project_developers pd
        where pd.project_id = messages.project_id
          and pd.developer_id = auth.uid()
      )
    )
    or (
      messages.channel = 'direct'
      and (messages.sender_id = auth.uid() or messages.recipient_id = auth.uid())
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text in ('developer', 'admin', 'manager')
      )
    )
  );

drop policy if exists "Users can send messages on their projects" on public.messages;
create policy "Users can send messages on their projects"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text in ('admin', 'manager')
      )
      or (
        channel = 'client'
        and exists (
          select 1
          from public.projects pr
          join public.client_users cu on cu.client_id = pr.client_id
          where pr.id = project_id
            and cu.user_id = auth.uid()
        )
      )
      or (
        channel = 'internal'
        and exists (
          select 1
          from public.project_developers pd
          where pd.project_id = project_id
            and pd.developer_id = auth.uid()
        )
      )
      or (
        channel = 'direct'
        and recipient_id is not null
        and recipient_id <> auth.uid()
        and exists (
          select 1
          from public.profiles sender_profile
          where sender_profile.id = auth.uid()
            and sender_profile.role::text in ('developer', 'admin', 'manager')
        )
        and exists (
          select 1
          from public.profiles recipient_profile
          where recipient_profile.id = recipient_id
            and recipient_profile.role::text in ('developer', 'admin', 'manager')
        )
      )
    )
  );

drop policy if exists "Users can mark project messages as read" on public.messages;
create policy "Users can mark project messages as read"
  on public.messages for update
  to authenticated
  using (
    sender_id <> auth.uid()
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text in ('admin', 'manager')
      )
      or (
        channel = 'client'
        and exists (
          select 1
          from public.projects pr
          join public.client_users cu on cu.client_id = pr.client_id
          where pr.id = project_id
            and cu.user_id = auth.uid()
        )
      )
      or (
        channel = 'internal'
        and exists (
          select 1
          from public.project_developers pd
          where pd.project_id = project_id
            and pd.developer_id = auth.uid()
        )
      )
      or (
        channel = 'direct'
        and recipient_id = auth.uid()
      )
    )
  )
  with check (
    sender_id <> auth.uid()
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role::text in ('admin', 'manager')
      )
      or (
        channel = 'client'
        and exists (
          select 1
          from public.projects pr
          join public.client_users cu on cu.client_id = pr.client_id
          where pr.id = project_id
            and cu.user_id = auth.uid()
        )
      )
      or (
        channel = 'internal'
        and exists (
          select 1
          from public.project_developers pd
          where pd.project_id = project_id
            and pd.developer_id = auth.uid()
        )
      )
      or (
        channel = 'direct'
        and recipient_id = auth.uid()
      )
    )
  );

create or replace function public.send_project_internal_message(
  target_project_id uuid,
  message_content text
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_message public.messages;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(message_content), '') is null then
    raise exception 'Message content is required';
  end if;

  if not (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role::text in ('admin', 'manager')
    )
    or exists (
      select 1
      from public.project_developers pd
      where pd.project_id = target_project_id
        and pd.developer_id = auth.uid()
    )
  ) then
    raise exception 'Not allowed to send internal message';
  end if;

  insert into public.messages (
    project_id,
    sender_id,
    content,
    channel,
    is_admin_sender
  )
  values (
    target_project_id,
    auth.uid(),
    trim(message_content),
    'internal',
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role::text in ('admin', 'manager')
    )
  )
  returning * into inserted_message;

  return inserted_message;
end;
$$;

grant execute on function public.send_project_internal_message(uuid, text) to authenticated;

create or replace function public.send_direct_chat_message(
  target_user_id uuid,
  message_content text
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_message public.messages;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Cannot send a direct message to yourself';
  end if;

  if nullif(trim(message_content), '') is null then
    raise exception 'Message content is required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text in ('developer', 'admin', 'manager')
  ) then
    raise exception 'Sender is not an internal user';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.role::text in ('developer', 'admin', 'manager')
  ) then
    raise exception 'Recipient is not an internal user';
  end if;

  insert into public.messages (
    sender_id,
    recipient_id,
    content,
    channel,
    is_admin_sender
  )
  values (
    auth.uid(),
    target_user_id,
    trim(message_content),
    'direct',
    false
  )
  returning * into inserted_message;

  return inserted_message;
end;
$$;

grant execute on function public.send_direct_chat_message(uuid, text) to authenticated;
