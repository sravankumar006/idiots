-- Migration Part 6 — AI Logs & Message Read Receipts Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create public.ai_logs table
create table if not exists public.ai_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  room_id uuid references public.groups(id) on delete cascade,
  prompt text not null,
  response text not null,
  model text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for ai_logs
alter table public.ai_logs enable row level security;

-- Policy for reading logs: authenticated users can read group chat logs (room_id is not null) or their own personal logs (room_id is null)
drop policy if exists "Allow read access to ai_logs for authenticated users" on public.ai_logs;
create policy "Allow read access to ai_logs for authenticated users"
on public.ai_logs for select
to authenticated
using (room_id is not null or user_id = auth.uid());

-- Policy for inserting logs: authenticated users can insert their own logs
drop policy if exists "Allow insert access to ai_logs for authenticated users" on public.ai_logs;
create policy "Allow insert access to ai_logs for authenticated users"
on public.ai_logs for insert
to authenticated
with check (auth.uid() = user_id);

-- 2. Create public.message_seen table (Read receipts tracking)
create table if not exists public.message_seen (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id)
);

-- Enable RLS for message_seen
alter table public.message_seen enable row level security;

-- Policy for reading seen status: authenticated users can read all seen entries
drop policy if exists "Allow read access to message_seen for authenticated users" on public.message_seen;
create policy "Allow read access to message_seen for authenticated users"
on public.message_seen for select
to authenticated
using (true);

-- Policy for inserting seen status: authenticated users can insert their own seen entry
drop policy if exists "Allow insert access to message_seen for authenticated users" on public.message_seen;
create policy "Allow insert access to message_seen for authenticated users"
on public.message_seen for insert
to authenticated
with check (auth.uid() = user_id);

-- 3. Register all tables with Realtime Replication publication cleanly
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.deleted_messages;
alter publication supabase_realtime add table public.group_clears;
alter publication supabase_realtime add table public.ai_logs;
alter publication supabase_realtime add table public.message_seen;
