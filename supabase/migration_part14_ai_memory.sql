-- Migration Part 14 — AI Context Memory System
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Upgrade existing ai_memories table
ALTER TABLE public.ai_memories RENAME COLUMN memory_text TO content;
ALTER TABLE public.ai_memories RENAME COLUMN user_id TO created_by;
ALTER TABLE public.ai_memories ADD COLUMN IF NOT EXISTS memory_type text DEFAULT 'General' NOT NULL;
ALTER TABLE public.ai_memories ADD COLUMN IF NOT EXISTS title text DEFAULT 'Memory' NOT NULL;
ALTER TABLE public.ai_memories ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Update RLS policies for ai_memories due to renamed column
DROP POLICY IF EXISTS "Allow users to read their own ai_memories" ON public.ai_memories;
DROP POLICY IF EXISTS "Allow users to insert their own ai_memories" ON public.ai_memories;
DROP POLICY IF EXISTS "Allow users to delete their own ai_memories" ON public.ai_memories;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow users to read their own ai_memories') then
    create policy "Allow users to read their own ai_memories" on public.ai_memories
      for select using (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own ai_memories') then
    create policy "Allow users to insert their own ai_memories" on public.ai_memories
      for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own ai_memories') then
    create policy "Allow users to delete their own ai_memories" on public.ai_memories
      for delete using (auth.uid() = created_by);
  end if;
end $$;


-- 3. Create Memory Summaries Table
create table if not exists public.memory_summaries (
  id uuid default gen_random_uuid() primary key,
  conversation_id text not null, -- can be room_id or 'personal_user_id'
  summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for memory_summaries
alter table public.memory_summaries enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read memory_summaries') then
    create policy "Allow authenticated users to read memory_summaries" on public.memory_summaries
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to insert memory_summaries') then
    create policy "Allow authenticated users to insert memory_summaries" on public.memory_summaries
      for insert with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to delete memory_summaries') then
    create policy "Allow authenticated users to delete memory_summaries" on public.memory_summaries
      for delete using (auth.role() = 'authenticated');
  end if;
end $$;

-- 4. Add to realtime replication publication
do $$
begin
  begin
    alter publication supabase_realtime add table public.memory_summaries;
  exception when others then null;
  end;
end $$;
