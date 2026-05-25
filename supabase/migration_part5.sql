-- Supabase Database Reset & Migration (Persistent Chat & Message Deletion)
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Drop existing tables cascade to resolve constraint issues and start fresh (safe as database is empty)
drop table if exists public.reactions cascade;
drop table if exists public.messages cascade;
drop table if exists public.groups cascade;
drop table if exists public.deleted_messages cascade;
drop table if exists public.group_clears cascade;

-- 2. Create public groups table correctly
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  group_name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for groups
alter table public.groups enable row level security;

create policy "Allow read access to groups for authenticated users"
on public.groups for select
using (auth.uid() is not null);

create policy "Allow group creation for authenticated users"
on public.groups for insert
with check (auth.uid() is not null);

-- 3. Create public messages table correctly
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  type text default 'text' not null,
  reply_to uuid references public.messages(id) on delete set null,
  file_url text,
  file_name text,
  file_size bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for messages
alter table public.messages enable row level security;

create policy "Allow read access to messages for authenticated users"
on public.messages for select
using (auth.uid() is not null);

create policy "Allow insert messages for authenticated users"
on public.messages for insert
with check (auth.uid() = sender_id);

-- 4. Create public reactions table correctly
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, emoji)
);

-- Enable RLS for reactions
alter table public.reactions enable row level security;

create policy "Allow read access to reactions for authenticated users"
on public.reactions for select
using (auth.uid() is not null);

create policy "Allow insert reactions for authenticated users"
on public.reactions for insert
with check (auth.uid() = user_id);

create policy "Allow delete reactions for owners"
on public.reactions for delete
using (auth.uid() = user_id);

-- 5. Create deleted_messages table (soft-delete for self)
create table public.deleted_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message_id uuid references public.messages(id) on delete cascade not null,
  deleted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, message_id)
);

-- Enable RLS for deleted_messages
alter table public.deleted_messages enable row level security;

create policy "Allow read access to deleted_messages for owners"
on public.deleted_messages for select
to authenticated
using (auth.uid() = user_id);

create policy "Allow insert deleted_messages for owners"
on public.deleted_messages for insert
to authenticated
with check (auth.uid() = user_id);

-- 6. Create group_clears table (clear chat for self)
create table public.group_clears (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  cleared_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_id)
);

-- Enable RLS for group_clears
alter table public.group_clears enable row level security;

create policy "Allow read access to group_clears for owners"
on public.group_clears for select
to authenticated
using (auth.uid() = user_id);

create policy "Allow insert group_clears for owners"
on public.group_clears for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Allow update group_clears for owners"
on public.group_clears for update
to authenticated
using (auth.uid() = user_id);

-- 7. Register tables for Realtime Replication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.deleted_messages;
alter publication supabase_realtime add table public.group_clears;
