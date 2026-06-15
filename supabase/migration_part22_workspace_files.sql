-- Migration Part 22 — Workspace Code Files Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create public.project_files table
create table if not exists public.project_files (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  content text default ''::text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, name)
);

-- Enable RLS for project_files
alter table public.project_files enable row level security;

-- 2. Create row-level security (RLS) policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read project_files') then
    create policy "Allow authenticated users to read project_files" on public.project_files
      for select using (auth.uid() is not null);
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert project_files') then
    create policy "Allow users to insert project_files" on public.project_files
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

  if not exists (select 1 from pg_policies where policyname = 'Allow users to update project_files') then
    create policy "Allow users to update project_files" on public.project_files
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

  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete project_files') then
    create policy "Allow users to delete project_files" on public.project_files
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
end $$;

-- 3. Enable Realtime Replication for project_files
do $$
begin
  begin
    alter publication supabase_realtime add table public.project_files;
  exception when others then null;
  end;
end $$;
