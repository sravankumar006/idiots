-- Migration Part 27 — Study Room Member Readiness
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- Add status column to public.study_room_members
alter table public.study_room_members add column if not exists status text default 'joined' not null;

-- Add check constraint for status
alter table public.study_room_members drop constraint if exists study_room_members_status_check;
alter table public.study_room_members add constraint study_room_members_status_check check (status in ('joined', 'ready'));

-- Add RLS update policy for study_room_members
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow users to update their own study_room_members status') then
    create policy "Allow users to update their own study_room_members status" on public.study_room_members
      for update using (auth.uid() = user_id);
  end if;
end $$;
