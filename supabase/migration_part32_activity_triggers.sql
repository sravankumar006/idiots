-- Migration Part 32: Automated Activity Triggers
-- This script sets up triggers to automatically log activities into the public.activity_logs table.

-- 1. Ensure projects table has updated_at column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Trigger to update projects.updated_at
CREATE OR REPLACE FUNCTION public.set_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_projects_updated_at();

-- 3. Trigger: Project Creation
CREATE OR REPLACE FUNCTION public.log_project_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
  VALUES (
    NEW.created_by,
    'project_create',
    'Created Project: ' || NEW.name,
    jsonb_build_object('project_id', NEW.id, 'project_name', NEW.name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_project_create
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_create();

-- 4. Trigger: Project Updates (fires when progress or github URL changes)
CREATE OR REPLACE FUNCTION public.log_project_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.progress IS DISTINCT FROM NEW.progress OR OLD.name IS DISTINCT FROM NEW.name OR OLD.github_url IS DISTINCT FROM NEW.github_url) THEN
    INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
    VALUES (
      NEW.created_by,
      'project_update',
      'Updated Project: ' || NEW.name || ' (Completion: ' || NEW.progress || '%)',
      jsonb_build_object('project_id', NEW.id, 'project_name', NEW.name, 'progress', NEW.progress)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_project_update
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_update();

-- 5. Trigger: Project Contributor Added
CREATE OR REPLACE FUNCTION public.log_project_contributor()
RETURNS TRIGGER AS $$
DECLARE
  p_name TEXT;
  u_name TEXT;
BEGIN
  SELECT name INTO p_name FROM public.projects WHERE id = NEW.project_id;
  SELECT username INTO u_name FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
  VALUES (
    NEW.user_id,
    'contributor_add',
    'Added as Contributor to Project: ' || COALESCE(p_name, 'Project'),
    jsonb_build_object('project_id', NEW.project_id, 'project_name', p_name, 'username', u_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_project_contributor
  AFTER INSERT ON public.project_contributors
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_contributor();

-- 6. Trigger: Host Focus Room
CREATE OR REPLACE FUNCTION public.log_study_room_host()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
  VALUES (
    NEW.host_user_id,
    'study_room_host',
    'Hosted Focus Room: ' || NEW.name,
    jsonb_build_object('room_id', NEW.id, 'room_name', NEW.name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_study_room_host
  AFTER INSERT ON public.study_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.log_study_room_host();

-- 7. Trigger: Join Focus Room
CREATE OR REPLACE FUNCTION public.log_study_room_join()
RETURNS TRIGGER AS $$
DECLARE
  r_name TEXT;
BEGIN
  SELECT name INTO r_name FROM public.study_rooms WHERE id = NEW.room_id;
  
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
  VALUES (
    NEW.user_id,
    'study_room_join',
    'Joined Focus Room: ' || COALESCE(r_name, 'Study Room'),
    jsonb_build_object('room_id', NEW.room_id, 'room_name', r_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_study_room_join
  AFTER INSERT ON public.study_room_members
  FOR EACH ROW
  EXECUTE FUNCTION public.log_study_room_join();

-- 8. Trigger: Completed Focus Session
CREATE OR REPLACE FUNCTION public.log_focus_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.completed IS DISTINCT FROM NEW.completed AND NEW.completed = true) THEN
    INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
    VALUES (
      NEW.user_id,
      'focus_session_complete',
      'Completed Focus Session: ' || COALESCE(NEW.goal, 'Study Session') || ' (' || NEW.actual_minutes || ' mins)',
      jsonb_build_object('session_id', NEW.id, 'goal', NEW.goal, 'minutes', NEW.actual_minutes)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_focus_session_complete
  AFTER UPDATE ON public.focus_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_focus_session_complete();

-- 9. Trigger: Added Vault Entry
CREATE OR REPLACE FUNCTION public.log_vault_add()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
  VALUES (
    NEW.user_id,
    'vault_add',
    'Added Vault Entry: ' || NEW.title,
    jsonb_build_object('entry_id', NEW.id, 'title', NEW.title, 'category', NEW.category)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_vault_add
  AFTER INSERT ON public.vault_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.log_vault_add();

-- 10. Trigger: Pinned Vault Entry
CREATE OR REPLACE FUNCTION public.log_vault_pin()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.is_pinned IS DISTINCT FROM NEW.is_pinned AND NEW.is_pinned = true) THEN
    INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
    VALUES (
      NEW.user_id,
      'vault_pin',
      'Pinned Vault Entry: ' || NEW.title,
      jsonb_build_object('entry_id', NEW.id, 'title', NEW.title)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_vault_pin
  AFTER UPDATE ON public.vault_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.log_vault_pin();

-- 11. Trigger: Unlocked Achievement
CREATE OR REPLACE FUNCTION public.log_achievement_unlock()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata_json)
  VALUES (
    NEW.user_id,
    'achievement_unlock',
    'Unlocked Achievement: ' || NEW.title,
    jsonb_build_object('achievement_id', NEW.id, 'title', NEW.title, 'verb', NEW.verb)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_log_achievement_unlock
  AFTER INSERT ON public.achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.log_achievement_unlock();
