-- Migration Part 20 — Push Notifications & Notification Center Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Create public.notification_settings table
create table if not exists public.notification_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  chat_enabled boolean default true not null,
  focus_enabled boolean default true not null,
  ai_enabled boolean default true not null,
  memory_enabled boolean default true not null,
  achievement_enabled boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for settings
alter table public.notification_settings enable row level security;

create policy "Allow users to read their own notification settings" on public.notification_settings
  for select using (auth.uid() = user_id);

create policy "Allow users to update their own notification settings" on public.notification_settings
  for update using (auth.uid() = user_id);

create policy "Allow users to insert their own notification settings" on public.notification_settings
  for insert with check (auth.uid() = user_id);

-- Seed existing profiles with default notification settings
insert into public.notification_settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- Sync trigger for new profiles
create or replace function public.handle_new_notification_settings()
returns trigger as $$
begin
  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_notifications on public.profiles;
create trigger on_profile_created_notifications
  after insert on public.profiles
  for each row execute procedure public.handle_new_notification_settings();


-- 2. Create public.user_devices table to store FCM registration tokens
create table if not exists public.user_devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  fcm_token text unique not null,
  platform text default 'web'::text not null, -- 'web', 'android', 'ios'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for user devices
alter table public.user_devices enable row level security;

create policy "Allow users to read their own registered devices" on public.user_devices
  for select using (auth.uid() = user_id);

create policy "Allow users to register their own devices" on public.user_devices
  for insert with check (auth.uid() = user_id);

create policy "Allow users to delete their own registered devices" on public.user_devices
  for delete using (auth.uid() = user_id);


-- 3. Create public.notifications table for the persistent Notification Center
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null, -- target recipient
  title text not null,
  body text not null,
  category text not null, -- 'chat', 'focus', 'ai', 'memory', 'achievement'
  type text not null, -- e.g. 'reply', 'reaction', 'mention', 'invitation', 'milestone', 'summary'
  related_id text, -- references to message_id, group_id, etc.
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for notifications
alter table public.notifications enable row level security;

create policy "Allow users to read their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Allow users to update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Allow users to delete their own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- Enable Realtime Replication for the tables
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when others then null;
  end;
end $$;
