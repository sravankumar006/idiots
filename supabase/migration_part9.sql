-- Migration Part 9 — Memory + Emotional Systems + Personal Spaces Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. User Spaces Table
create table if not exists public.user_spaces (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  wallpaper_url text default ''::text not null,
  theme_color text default 'violet'::text not null,
  pinned_quote text default 'stay warm, stay coding.'::text not null,
  song_title text default ''::text not null,
  song_url text default ''::text not null,
  study_playlist_url text default ''::text not null,
  widgets_layout jsonb default '["mood", "quote", "music", "goals", "streak", "contributions"]'::jsonb not null,
  ambient_sound text default 'none'::text not null,
  profile_accents text default 'none'::text not null,
  music_autoplay boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for user_spaces
alter table public.user_spaces enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to user_spaces') then
    create policy "Allow public read access to user_spaces" on public.user_spaces
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own user_space') then
    create policy "Allow users to update their own user_space" on public.user_spaces
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own user_space') then
    create policy "Allow users to insert their own user_space" on public.user_spaces
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 2. Mood Logs Table
create table if not exists public.mood_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood_rating integer default 5 not null,
  energy_level integer default 5 not null,
  focus_level integer default 5 not null,
  status_text text default ''::text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for mood_logs
alter table public.mood_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to mood_logs') then
    create policy "Allow public read access to mood_logs" on public.mood_logs
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own mood_logs') then
    create policy "Allow users to insert their own mood_logs" on public.mood_logs
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own mood_logs') then
    create policy "Allow users to delete their own mood_logs" on public.mood_logs
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 3. Memory Vault Table
create table if not exists public.memory_vault (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message_id uuid references public.messages(id) on delete set null,
  file_url text default ''::text not null,
  file_name text default ''::text not null,
  notes text default ''::text not null,
  is_shared boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for memory_vault
alter table public.memory_vault enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read shared memory_vault') then
    create policy "Allow authenticated users to read shared memory_vault" on public.memory_vault
      for select using (is_shared = true or auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own memory_vault') then
    create policy "Allow users to insert their own memory_vault" on public.memory_vault
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own memory_vault') then
    create policy "Allow users to update their own memory_vault" on public.memory_vault
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own memory_vault') then
    create policy "Allow users to delete their own memory_vault" on public.memory_vault
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 4. AI Memories Table
create table if not exists public.ai_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  memory_text text not null,
  is_visible boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for ai_memories
alter table public.ai_memories enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow users to read their own ai_memories') then
    create policy "Allow users to read their own ai_memories" on public.ai_memories
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own ai_memories') then
    create policy "Allow users to insert their own ai_memories" on public.ai_memories
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own ai_memories') then
    create policy "Allow users to delete their own ai_memories" on public.ai_memories
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 5. Add to realtime replication publication
do $$
begin
  begin
    alter publication supabase_realtime add table public.user_spaces;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.mood_logs;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.memory_vault;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.ai_memories;
  exception when others then null;
  end;
end $$;
