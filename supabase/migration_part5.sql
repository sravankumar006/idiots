-- Supabase Database Migration for Part 5 (Persistent Chat & Message Deletion)
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create deleted_messages table (soft-delete for self)
create table if not exists public.deleted_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message_id uuid references public.messages(id) on delete cascade not null,
  deleted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, message_id)
);

-- Enable Row Level Security (RLS)
alter table public.deleted_messages enable row level security;

-- Create policies for deleted_messages
create policy "Allow read access to deleted_messages for owners"
on public.deleted_messages for select
to authenticated
using (auth.uid() = user_id);

create policy "Allow insert deleted_messages for owners"
on public.deleted_messages for insert
to authenticated
with check (auth.uid() = user_id);

-- 2. Create group_clears table (clear chat for self)
create table if not exists public.group_clears (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  cleared_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_id)
);

-- Enable Row Level Security (RLS)
alter table public.group_clears enable row level security;

-- Create policies for group_clears
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

-- 3. Register tables for Realtime Replication
begin;
  alter publication supabase_realtime add table public.deleted_messages;
  alter publication supabase_realtime add table public.group_clears;
commit;
