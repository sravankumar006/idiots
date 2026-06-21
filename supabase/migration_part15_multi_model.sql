-- Migration Part 15 — AI Multi-Model Architecture
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Extend ai_logs table with multi-provider and performance tracking columns
ALTER TABLE public.ai_logs ADD COLUMN IF NOT EXISTS provider text DEFAULT 'gemini' NOT NULL;
ALTER TABLE public.ai_logs ADD COLUMN IF NOT EXISTS response_time_ms integer DEFAULT 0 NOT NULL;
ALTER TABLE public.ai_logs ADD COLUMN IF NOT EXISTS success boolean DEFAULT true NOT NULL;
ALTER TABLE public.ai_logs ADD COLUMN IF NOT EXISTS error_message text;

-- 2. Allow response column to be nullable (failed requests won't have a response text)
ALTER TABLE public.ai_logs ALTER COLUMN response DROP NOT NULL;

