-- Migration Part 25 — Study Lounge Multi-Room Architecture
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create public.study_rooms table
create table if not exists public.study_rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default ''::text not null,
  host_user_id uuid references public.profiles(id) on delete cascade not null,
  room_status text default 'waiting'::text not null, -- 'waiting', 'active', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  started_at timestamp with time zone,
  ended_at timestamp with time zone
);

-- Enable RLS for study_rooms
alter table public.study_rooms enable row level security;

-- 2. Create public.study_room_members table
create table if not exists public.study_room_members (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.study_rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_host boolean default false not null,
  constraint study_room_members_unique_user unique (room_id, user_id)
);

-- Enable RLS for study_room_members
alter table public.study_room_members enable row level security;

-- 3. Create public.study_room_comments table
create table if not exists public.study_room_comments (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.study_rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for study_room_comments
alter table public.study_room_comments enable row level security;

-- 4. Create RLS Policies
do $$
begin
  -- Study Rooms Policies
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read study_rooms') then
    create policy "Allow authenticated users to read study_rooms" on public.study_rooms
      for select using (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own study_rooms') then
    create policy "Allow users to insert their own study_rooms" on public.study_rooms
      for insert with check (auth.uid() = host_user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow hosts to update study_rooms') then
    create policy "Allow hosts to update study_rooms" on public.study_rooms
      for update using (auth.uid() = host_user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow hosts to delete study_rooms') then
    create policy "Allow hosts to delete study_rooms" on public.study_rooms
      for delete using (auth.uid() = host_user_id);
  end if;

  -- Study Room Members Policies
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read study_room_members') then
    create policy "Allow authenticated users to read study_room_members" on public.study_room_members
      for select using (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow users to join study_rooms') then
    create policy "Allow users to join study_rooms" on public.study_room_members
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow users to leave study_rooms') then
    create policy "Allow users to leave study_rooms" on public.study_room_members
      for delete using (auth.uid() = user_id);
  end if;

  -- Study Room Comments Policies
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read study_room_comments') then
    create policy "Allow authenticated users to read study_room_comments" on public.study_room_comments
      for select using (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow members to insert study_room_comments') then
    create policy "Allow members to insert study_room_comments" on public.study_room_comments
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow authors to delete their study_room_comments') then
    create policy "Allow authors to delete their study_room_comments" on public.study_room_comments
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 5. Add new tables to replication publication for Realtime updates
do $$
begin
  begin
    alter publication supabase_realtime add table public.study_rooms;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.study_room_members;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.study_room_comments;
  exception when others then null;
  end;
end $$;
