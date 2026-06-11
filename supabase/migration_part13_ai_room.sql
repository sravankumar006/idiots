-- Migration part 13: Shared AI Room Categories
-- Adds the 'category' field to the messages table to support the AI logs workspace.

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS category text DEFAULT 'General';
ALTER TABLE public.ai_logs ADD COLUMN IF NOT EXISTS category text DEFAULT 'General';
