-- Migration Part 30: Profile Integrations table setup
CREATE TABLE IF NOT EXISTS public.profile_integrations (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  github_username TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  bio TEXT,
  current_mission TEXT,
  current_mission_progress INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profile_integrations ENABLE ROW LEVEL SECURITY;

-- 1. Policy for public read access to integrations
CREATE POLICY "Allow public read access to profile integrations"
  ON public.profile_integrations
  FOR SELECT
  USING (true);

-- 2. Policy for users to insert their own integration row
CREATE POLICY "Allow users to insert their own profile integrations"
  ON public.profile_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Policy for users to update their own integration row
CREATE POLICY "Allow users to update their own profile integrations"
  ON public.profile_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Policy for users to delete their own integration row
CREATE POLICY "Allow users to delete their own profile integrations"
  ON public.profile_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for profile_integrations
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_integrations;
