-- Migration Part 6 — AI Logs System Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- Create public.ai_logs table
create table if not exists public.ai_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  room_id uuid references public.groups(id) on delete cascade,
  prompt text not null,
  response text not null,
  model text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.ai_logs enable row level security;

-- Policy for reading logs: all authenticated users can read logs
create policy "Allow read access to ai_logs for authenticated users"
on public.ai_logs for select
to authenticated
using (true);

-- Policy for inserting logs: authenticated users can insert their own logs
create policy "Allow insert access to ai_logs for authenticated users"
on public.ai_logs for insert
to authenticated
with check (auth.uid() = user_id);

-- Register with Realtime if needed (optional, but good for sync)
begin;
  -- Add table to realtime replication publication if it exists
  alter publication supabase_realtime add table public.ai_logs;
exception
  when others then
    -- If publication or table already exists in it, ignore
    null;
end;
