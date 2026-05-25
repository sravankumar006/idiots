-- Migration Part 8 — Dashboard System & Career Ecosystem Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Career Profiles Table
create table if not exists public.career_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  resume_url text,
  portfolio_url text,
  certifications text[] default '{}'::text[] not null,
  internship_status text default 'none'::text not null,
  learning_roadmap text default ''::text not null,
  dream_company text default ''::text not null,
  target_goals text[] default '{}'::text[] not null,
  tech_stack text[] default '{}'::text[] not null,
  favorite_language text default ''::text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for career_profiles
alter table public.career_profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to career_profiles') then
    create policy "Allow public read access to career_profiles" on public.career_profiles
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own career_profile') then
    create policy "Allow users to update their own career_profile" on public.career_profiles
      for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own career_profile') then
    create policy "Allow users to insert their own career_profile" on public.career_profiles
      for insert with check (auth.uid() = id);
  end if;
end $$;

-- 2. Coding Stats Table
create table if not exists public.coding_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  leetcode_username text default ''::text not null,
  leetcode_solved integer default 0 not null,
  leetcode_streak integer default 0 not null,
  hackerrank_username text default ''::text not null,
  hackerrank_solved integer default 0 not null,
  codeforces_username text default ''::text not null,
  codeforces_solved integer default 0 not null,
  github_username text default ''::text not null,
  github_contributions integer default 0 not null,
  languages_json jsonb default '{}'::jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS for coding_stats
alter table public.coding_stats enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to coding_stats') then
    create policy "Allow public read access to coding_stats" on public.coding_stats
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own coding_stats') then
    create policy "Allow users to update their own coding_stats" on public.coding_stats
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own coding_stats') then
    create policy "Allow users to insert their own coding_stats" on public.coding_stats
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 3. Study Stats Table
create table if not exists public.study_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  total_study_minutes integer default 0 not null,
  completed_pomodoros integer default 0 not null,
  pdfs_reviewed integer default 0 not null,
  ai_sessions_count integer default 0 not null,
  current_streak integer default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS for study_stats
alter table public.study_stats enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to study_stats') then
    create policy "Allow public read access to study_stats" on public.study_stats
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own study_stats') then
    create policy "Allow users to update their own study_stats" on public.study_stats
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own study_stats') then
    create policy "Allow users to insert their own study_stats" on public.study_stats
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 4. Projects Table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default ''::text not null,
  tech_stack text[] default '{}'::text[] not null,
  progress integer default 0 not null,
  github_url text default ''::text not null,
  live_url text default ''::text not null,
  notes text default ''::text not null,
  references_text text default ''::text not null,
  deadline timestamp with time zone,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for projects
alter table public.projects enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read projects') then
    create policy "Allow authenticated users to read projects" on public.projects
      for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own projects') then
    create policy "Allow users to update their own projects" on public.projects
      for update using (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert projects') then
    create policy "Allow users to insert projects" on public.projects
      for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own projects') then
    create policy "Allow users to delete their own projects" on public.projects
      for delete using (auth.uid() = created_by);
  end if;
end $$;

-- 5. Project Contributors Table
create table if not exists public.project_contributors (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(project_id, user_id)
);

-- Enable RLS for project_contributors
alter table public.project_contributors enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read project_contributors') then
    create policy "Allow authenticated users to read project_contributors" on public.project_contributors
      for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to add contributors to their projects') then
    create policy "Allow users to add contributors to their projects" on public.project_contributors
      for insert with check (
        exists (
          select 1 from public.projects
          where id = project_id and created_by = auth.uid()
        ) or auth.uid() = user_id
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to remove contributors') then
    create policy "Allow users to remove contributors" on public.project_contributors
      for delete using (
        exists (
          select 1 from public.projects
          where id = project_id and created_by = auth.uid()
        ) or auth.uid() = user_id
      );
  end if;
end $$;

-- 6. Activity Logs Table
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null,
  description text not null,
  metadata_json jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for activity_logs
alter table public.activity_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to activity_logs') then
    create policy "Allow public read access to activity_logs" on public.activity_logs
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own activity_logs') then
    create policy "Allow users to insert their own activity_logs" on public.activity_logs
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 7. Add tables to realtime replication publication
-- Check if publication is enabled and alter it
-- Since Next/Supabase environment might run this migration multiple times, we wrap it in safety check
do $$
begin
  -- Alter publication if tables not in it yet
  begin
    alter publication supabase_realtime add table public.career_profiles;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.coding_stats;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.study_stats;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.projects;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.project_contributors;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.activity_logs;
  exception when others then null;
  end;
end $$;
