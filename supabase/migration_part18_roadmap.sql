-- Migration Part 18 — Learning Roadmap System
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

create table if not exists public.roadmap_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stage text not null,
  title text not null,
  completed boolean default false not null,
  display_order integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.roadmap_items enable row level security;

-- Create Policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read access to roadmap_items') then
    create policy "Allow public read access to roadmap_items" on public.roadmap_items
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own roadmap_items') then
    create policy "Allow users to insert their own roadmap_items" on public.roadmap_items
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own roadmap_items') then
    create policy "Allow users to update their own roadmap_items" on public.roadmap_items
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own roadmap_items') then
    create policy "Allow users to delete their own roadmap_items" on public.roadmap_items
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Enable Realtime Replication
do $$
begin
  begin
    alter publication supabase_realtime add table public.roadmap_items;
  exception when others then null;
  end;
end $$;
