-- Migration Part 26 — Study Room Invitations & Visibility
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Add is_public column to public.study_rooms
alter table public.study_rooms add column if not exists is_public boolean default true not null;

-- 2. Create public.study_room_invitations table
create table if not exists public.study_room_invitations (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.study_rooms(id) on delete cascade not null,
  inviter_user_id uuid references public.profiles(id) on delete cascade not null,
  invitee_user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending'::text not null, -- 'pending', 'accepted', 'declined'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint study_room_invitations_unique unique (room_id, invitee_user_id),
  constraint study_room_invitations_status_check check (status in ('pending', 'accepted', 'declined'))
);

-- Enable RLS for study_room_invitations
alter table public.study_room_invitations enable row level security;

-- 3. Create RLS Policies for study_room_invitations
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow users to read their own invitations') then
    create policy "Allow users to read their own invitations" on public.study_room_invitations
      for select using (auth.uid() = inviter_user_id or auth.uid() = invitee_user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow hosts to invite users') then
    create policy "Allow hosts to invite users" on public.study_room_invitations
      for insert with check (auth.uid() = inviter_user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow invitees to update status') then
    create policy "Allow invitees to update status" on public.study_room_invitations
      for update using (auth.uid() = invitee_user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete invitations') then
    create policy "Allow users to delete invitations" on public.study_room_invitations
      for delete using (auth.uid() = inviter_user_id or auth.uid() = invitee_user_id);
  end if;
end $$;

-- 4. Re-configure study_rooms select policy for privacy
drop policy if exists "Allow authenticated users to read study_rooms" on public.study_rooms;

create policy "Allow authenticated users to read study_rooms" on public.study_rooms
  for select using (
    is_public = true or
    auth.uid() = host_user_id or
    exists (
      select 1 from public.study_room_members
      where room_id = study_rooms.id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.study_room_invitations
      where room_id = study_rooms.id and invitee_user_id = auth.uid()
    )
  );

-- 5. Add table to replication publication for Realtime updates
do $$
begin
  begin
    alter publication supabase_realtime add table public.study_room_invitations;
  exception when others then null;
  end;
end $$;
