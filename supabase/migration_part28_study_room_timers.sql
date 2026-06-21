-- Migration Part 28 — Study Room Shared Timer
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

create table if not exists public.study_room_timers (
  room_id uuid references public.study_rooms(id) on delete cascade primary key,
  start_time timestamp with time zone,
  duration_minutes integer not null, -- total duration in minutes
  status text default 'idle'::text not null, -- 'idle', 'running', 'paused', 'completed'
  elapsed_seconds integer default 0 not null, -- accumulated elapsed seconds
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.study_room_timers enable row level security;

-- Policies for study_room_timers
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow authenticated users to read study_room_timers') then
    create policy "Allow authenticated users to read study_room_timers" on public.study_room_timers
      for select using (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow members to insert/update study_room_timers') then
    create policy "Allow members to insert/update study_room_timers" on public.study_room_timers
      for all using (
        exists (
          select 1 from public.study_room_members
          where room_id = study_room_timers.room_id and user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Enable Realtime Replication
do $$
begin
  begin
    alter publication supabase_realtime add table public.study_room_timers;
  exception when others then null;
  end;
end $$;
