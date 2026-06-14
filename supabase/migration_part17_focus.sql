-- Migration Part 17 — Zen Focus Sessions & Productivity Stats
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

create table if not exists public.focus_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  goal text not null,
  duration_minutes integer, -- Null or 0 means no timer mode
  actual_minutes integer default 0 not null,
  elapsed_seconds integer default 0 not null, -- For active session recovery
  theme text default 'minimal_zen' not null,
  notes text default ''::text not null,
  accomplishments text default ''::text not null,
  reflections text default ''::text not null,
  completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  
  -- Architecture preparation fields
  is_deep_focus boolean default false not null,
  group_id uuid, -- For group sessions in the future
  points_earned integer default 0 not null
);

-- Enable RLS
alter table public.focus_sessions enable row level security;

-- Policies for focus_sessions
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to focus_sessions') then
    create policy "Allow public read access to focus_sessions" on public.focus_sessions
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own focus_sessions') then
    create policy "Allow users to insert their own focus_sessions" on public.focus_sessions
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own focus_sessions') then
    create policy "Allow users to update their own focus_sessions" on public.focus_sessions
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own focus_sessions') then
    create policy "Allow users to delete their own focus_sessions" on public.focus_sessions
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Enable Realtime Replication
do $$
begin
  begin
    alter publication supabase_realtime add table public.focus_sessions;
  exception when others then null;
  end;
end $$;
