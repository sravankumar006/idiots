-- Migration Part 16 — AI Workspace Polish
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create a unified saved items table for Vault, Notes, and Saved Responses
create table if not exists public.user_saved_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_type text not null check (item_type in ('vault', 'note', 'saved_response')),
  title text default 'Untitled' not null,
  content text not null,
  source_id text, -- Flexible ID referencing the original message/log
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.user_saved_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow users to read their own saved items') then
    create policy "Allow users to read their own saved items" on public.user_saved_items
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to insert their own saved items') then
    create policy "Allow users to insert their own saved items" on public.user_saved_items
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow users to delete their own saved items') then
    create policy "Allow users to delete their own saved items" on public.user_saved_items
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 3. Add to realtime replication publication
do $$
begin
  begin
    alter publication supabase_realtime add table public.user_saved_items;
  exception when others then null;
  end;
end $$;
