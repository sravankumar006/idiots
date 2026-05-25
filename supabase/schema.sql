-- AetherLink / Idiots Space Database Schema Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create public profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  avatar text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) for profiles
alter table public.profiles enable row level security;

create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Trigger to sync auth users to public profiles table automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Explorer'),
    coalesce(new.raw_user_meta_data->>'avatar', 'avatar-cyber-ghost'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create chat groups table
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  group_name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for groups
alter table public.groups enable row level security;

create policy "Allow read access to groups for authenticated users" on public.groups
  for select using (auth.uid() is not null);

create policy "Allow group creation for authenticated users" on public.groups
  for insert with check (auth.uid() is not null);

-- 4. Create messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  type text default 'text' not null,
  reply_to uuid references public.messages(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for messages
alter table public.messages enable row level security;

create policy "Allow read access to messages for authenticated users" on public.messages
  for select using (auth.uid() is not null);

create policy "Allow insert messages for authenticated users" on public.messages
  for insert with check (auth.uid() = sender_id);

-- 5. Create reactions table
create table if not exists public.reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, emoji)
);

-- Enable RLS for reactions
alter table public.reactions enable row level security;

create policy "Allow read access to reactions for authenticated users" on public.reactions
  for select using (auth.uid() is not null);

create policy "Allow insert reactions for authenticated users" on public.reactions
  for insert with check (auth.uid() = user_id);

create policy "Allow delete reactions for owners" on public.reactions
  for delete using (auth.uid() = user_id);

-- 6. Enable Realtime Replication for the tables
begin;
  -- Re-create publication if needed or ignore
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- Add tables to realtime replication publication
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.reactions;
