-- Migration Part 10 — Stable AI User Profile & Database-backed Timeline Memories Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create public.memories table
create table if not exists public.memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text default ''::text not null,
  type text default 'quote'::text not null, -- 'milestone', 'photo', 'quote', 'ai_recall', 'study_night', etc.
  media_url text default ''::text not null, -- for photos/attachments if any
  visibility text default 'public'::text not null, -- 'public' or 'private'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for memories
alter table public.memories enable row level security;

-- Policies for memories
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to memories') then
    create policy "Allow public read access to memories" on public.memories
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own memories') then
    create policy "Allow users to insert their own memories" on public.memories
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own memories') then
    create policy "Allow users to update their own memories" on public.memories
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own memories') then
    create policy "Allow users to delete their own memories" on public.memories
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 2. Seed AI user in auth.users & public.profiles
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000',
  'ai@system.local',
  '{"username": "IS AI", "avatar": "avatar-cyber-ghost"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.profiles (id, username, avatar, email)
values (
  '00000000-0000-0000-0000-000000000000',
  'IS AI',
  'avatar-cyber-ghost',
  'ai@system.local'
)
on conflict (id) do update
set username = excluded.username,
    avatar = excluded.avatar,
    email = excluded.email;

-- 3. Adjust messages RLS policy to allow users to insert messages on behalf of AI
drop policy if exists "Allow insert messages for authenticated users" on public.messages;
create policy "Allow insert messages for authenticated users" on public.messages
  for insert with check (auth.uid() = sender_id or sender_id = '00000000-0000-0000-0000-000000000000');

-- 4. Enable Realtime Replication for memories
do $$
begin
  begin
    alter publication supabase_realtime add table public.memories;
  exception when others then null;
  end;
end $$;
