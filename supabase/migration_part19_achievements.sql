-- Migration Part 19 — Community Achievements & Visibility
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  verb text default 'completed'::text not null, -- e.g. 'completed', 'reached'
  visibility text default 'public'::text not null, -- 'private', 'friends', 'workspace', 'public'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.achievements enable row level security;

-- Policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow read achievements based on visibility') then
    create policy "Allow read achievements based on visibility" on public.achievements
      for select using (
        visibility in ('public', 'workspace', 'friends') or 
        auth.uid() = user_id
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own achievements') then
    create policy "Allow users to insert their own achievements" on public.achievements
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own achievements') then
    create policy "Allow users to update their own achievements" on public.achievements
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own achievements') then
    create policy "Allow users to delete their own achievements" on public.achievements
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Add achievement_visibility column to public.career_profiles
alter table public.career_profiles 
  add column if not exists achievement_visibility text default 'public'::text not null;

-- Enable Realtime replication
do $$
begin
  begin
    alter publication supabase_realtime add table public.achievements;
  exception when others then null;
  end;
end $$;
