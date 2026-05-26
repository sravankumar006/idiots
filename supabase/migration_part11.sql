-- Migration Part 11 — Create missing message_seen table
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create public.message_seen table (Read receipts tracking)
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

-- 2. Register with Realtime Replication
do $$
begin
  begin
    alter publication supabase_realtime add table public.message_seen;
  exception when others then null;
  end;
end $$;
