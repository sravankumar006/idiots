-- Migration Part 8 — Memory + Emotional Systems + Personal Spaces Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create or Adjust public.memories table
create table if not exists public.memories (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references public.profiles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade, -- backward compatibility
  title text not null,
  description text default ''::text not null,
  memory_type text default 'manual'::text not null, -- manual, ai_recall, achievement, study, project, friendship, chaos
  type text default 'quote'::text, -- backward compatibility
  media_url text default ''::text not null,
  visibility text default 'public'::text not null, -- public, private
  related_users text[] default '{}'::text[] not null, -- usernames of group members involved
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for memories
alter table public.memories enable row level security;

-- Policies for memories
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to memories') then
    create policy "Allow public read access to memories" on public.memories
      for select using (visibility = 'public' or auth.uid() = created_by or auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own memories') then
    create policy "Allow users to insert their own memories" on public.memories
      for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own memories') then
    create policy "Allow users to update their own memories" on public.memories
      for update using (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own memories') then
    create policy "Allow users to delete their own memories" on public.memories
      for delete using (auth.uid() = created_by);
  end if;
end $$;

-- 2. Create or Adjust public.mood_logs table
create table if not exists public.mood_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood_value integer default 50 not null, -- 0-100 scale
  mood_label text default '😐 Okay'::text not null, -- emoji + text
  mood_rating integer default 5 not null, -- backward compatibility (1-10)
  energy_level integer default 5 not null,
  focus_level integer default 5 not null,
  status_text text default ''::text not null,
  visibility text default 'public'::text not null, -- public, private (privacy controls)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alter existing mood_logs if they are missing newer columns
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mood_logs' and column_name = 'mood_value') then
    alter table public.mood_logs add column mood_value integer default 50 not null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mood_logs' and column_name = 'mood_label') then
    alter table public.mood_logs add column mood_label text default '😐 Okay'::text not null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mood_logs' and column_name = 'visibility') then
    alter table public.mood_logs add column visibility text default 'public'::text not null;
  end if;
end $$;

-- Enable RLS for mood_logs
alter table public.mood_logs enable row level security;

-- Policies for mood_logs
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow select mood_logs') then
    create policy "Allow select mood_logs" on public.mood_logs
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

-- 3. Create public.personal_spaces table
create table if not exists public.personal_spaces (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  profile_banner text default ''::text not null,
  profile_wallpaper text default 'starry-night'::text not null,
  favorite_quote text default 'stay warm, stay coding.'::text not null,
  pinned_memories uuid[] default '{}'::uuid[] not null,
  coding_goals text[] default '{}'::text[] not null,
  study_goals text[] default '{}'::text[] not null,
  current_status text default ''::text not null,
  theme_colors text default 'violet'::text not null,
  ambient_sound text default 'none'::text not null,
  profile_accents text default 'none'::text not null,
  music_autoplay boolean default false not null,
  song_title text default 'Cozy Rain Ambience'::text not null,
  song_url text default 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'::text not null,
  study_playlist_url text default ''::text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for personal_spaces
alter table public.personal_spaces enable row level security;

-- Policies for personal_spaces
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to personal_spaces') then
    create policy "Allow public read access to personal_spaces" on public.personal_spaces
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own personal_space') then
    create policy "Allow users to update their own personal_space" on public.personal_spaces
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own personal_space') then
    create policy "Allow users to insert their own personal_space" on public.personal_spaces
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 4. Create public.dashboard_layouts table
create table if not exists public.dashboard_layouts (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  widgets_layout text[] default '{"mood", "quote", "music", "goals", "streak", "contributions"}'::text[] not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for dashboard_layouts
alter table public.dashboard_layouts enable row level security;

-- Policies for dashboard_layouts
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to dashboard_layouts') then
    create policy "Allow public read access to dashboard_layouts" on public.dashboard_layouts
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own dashboard_layout') then
    create policy "Allow users to update their own dashboard_layout" on public.dashboard_layouts
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own dashboard_layout') then
    create policy "Allow users to insert their own dashboard_layout" on public.dashboard_layouts
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 5. Create public.vault_entries table
create table if not exists public.vault_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message_id uuid references public.messages(id) on delete set null,
  file_url text default ''::text not null,
  file_name text default ''::text not null,
  notes text default ''::text not null,
  is_shared boolean default true not null,
  category text default 'chats'::text not null, -- chats, photos, videos, pdfs, screenshots, etc.
  tags text[] default '{}'::text[] not null, -- tags for searching/filtering
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for vault_entries
alter table public.vault_entries enable row level security;

-- Policies for vault_entries
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow crew to read shared vault_entries') then
    create policy "Allow crew to read shared vault_entries" on public.vault_entries
      for select using (is_shared = true or auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own vault_entries') then
    create policy "Allow users to insert their own vault_entries" on public.vault_entries
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own vault_entries') then
    create policy "Allow users to update their own vault_entries" on public.vault_entries
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own vault_entries') then
    create policy "Allow users to delete their own vault_entries" on public.vault_entries
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 6. Add all new tables to Supabase Realtime Replication
do $$
begin
  begin
    alter publication supabase_realtime add table public.memories;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.mood_logs;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.personal_spaces;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.dashboard_layouts;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.vault_entries;
  exception when others then null;
  end;
end $$;
