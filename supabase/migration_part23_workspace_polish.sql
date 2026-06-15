-- Migration Part 23 — Workspace Customization, Tasks, and Activity Feed
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Alter public.projects to support mood, icon, banner, and accent colors
alter table public.projects add column if not exists mood text default 'idle'::text not null;
alter table public.projects add column if not exists icon text default '🚀'::text not null;
alter table public.projects add column if not exists banner_url text default ''::text not null;
alter table public.projects add column if not exists accent_color text default '#7c3aed'::text not null;

-- 2. Create public.project_tasks table for workspace TODOs
create table if not exists public.project_tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text default ''::text not null,
  completed boolean default false not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for project_tasks
alter table public.project_tasks enable row level security;

-- 3. Create public.project_activities table for real-time audit logs
create table if not exists public.project_activities (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text not null,
  activity_type text not null, -- 'file_create', 'file_delete', 'file_update', 'note_edit', 'task_create', 'task_update', 'contributor_add', 'focus_start', 'focus_complete', 'upload', 'customization_change'
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for project_activities
alter table public.project_activities enable row level security;

-- 4. Create RLS Policies for tasks and activities
do $$
begin
  -- Project Tasks Policies
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read project_tasks') then
    create policy "Allow authenticated users to read project_tasks" on public.project_tasks
      for select using (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow contributors to insert project_tasks') then
    create policy "Allow contributors to insert project_tasks" on public.project_tasks
      for insert with check (
        exists (
          select 1 from public.projects
          where id = project_id and (created_by = auth.uid() or exists (
            select 1 from public.project_contributors
            where project_id = id and user_id = auth.uid()
          ))
        )
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow contributors to update project_tasks') then
    create policy "Allow contributors to update project_tasks" on public.project_tasks
      for update using (
        exists (
          select 1 from public.projects
          where id = project_id and (created_by = auth.uid() or exists (
            select 1 from public.project_contributors
            where project_id = id and user_id = auth.uid()
          ))
        )
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow contributors to delete project_tasks') then
    create policy "Allow contributors to delete project_tasks" on public.project_tasks
      for delete using (
        exists (
          select 1 from public.projects
          where id = project_id and (created_by = auth.uid() or exists (
            select 1 from public.project_contributors
            where project_id = id and user_id = auth.uid()
          ))
        )
      );
  end if;

  -- Project Activities Policies
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read project_activities') then
    create policy "Allow authenticated users to read project_activities" on public.project_activities
      for select using (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow contributors to insert project_activities') then
    create policy "Allow contributors to insert project_activities" on public.project_activities
      for insert with check (
        exists (
          select 1 from public.projects
          where id = project_id and (created_by = auth.uid() or exists (
            select 1 from public.project_contributors
            where project_id = id and user_id = auth.uid()
          ))
        )
      );
  end if;
end $$;

-- 5. Add new tables to replication publication
do $$
begin
  begin
    alter publication supabase_realtime add table public.project_tasks;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.project_activities;
  exception when others then null;
  end;
end $$;
