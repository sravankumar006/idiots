-- Migration part 12: AI Core Identity setup

-- Create the permanent AI user identity.
-- Note: '00000000-0000-0000-0000-000000000000' is the designated AI user ID across the platform.

-- 1. Insert into auth.users (if it doesn't already exist)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'rocky@idiots.local',
  '',
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"rocky","avatar":"avatar-cyber-ghost","role":"assistant"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert into public.profiles (to ensure the AI profile exists regardless of auth trigger timing)
INSERT INTO public.profiles (
  id,
  username,
  avatar,
  email,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'rocky',
  'avatar-cyber-ghost',
  'rocky@idiots.local',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  avatar = EXCLUDED.avatar;

-- Ensure ai_logs exists with appropriate fields (It was created in part 6, but we double-check)
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  room_id uuid, -- Can be null for personal AI chat
  prompt text NOT NULL,
  response text,
  model text DEFAULT 'gemini-2.5-flash',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
