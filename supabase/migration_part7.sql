-- Migration Part 7 — Study Mode & Focus System Setup
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- Add study mode columns to the public.groups table
alter table public.groups add column if not exists study_mode_active boolean default false not null;
alter table public.groups add column if not exists study_timer_ends_at timestamp with time zone;
alter table public.groups add column if not exists study_timer_duration integer default 0 not null;
alter table public.groups add column if not exists study_timer_type text default 'idle' not null;
