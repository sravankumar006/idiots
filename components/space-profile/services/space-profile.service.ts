import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export const getCurrentUserProfile = async () => {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr) throw authErr
    if (!user) return { success: true, data: null }

    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (profErr) throw profErr

    return { success: true, data: prof }
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error)
    return { success: false, error }
  }
}

export const getTargetProfile = async (username: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getTargetProfile:', error)
    return { success: false, error }
  }
}

export const getProfileIntegration = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profile_integrations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getProfileIntegration:', error)
    return { success: false, error }
  }
}

export const getProjects = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_contributors(user_id)')
      .eq('created_by', userId)
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getProjects:', error)
    return { success: false, error }
  }
}

export const getAchievements = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getAchievements:', error)
    return { success: false, error }
  }
}

export const getActivityLogs = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40)
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getActivityLogs:', error)
    return { success: false, error }
  }
}

export const getFocusSessions = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getFocusSessions:', error)
    return { success: false, error }
  }
}

export const saveProfileIntegration = async (updatedData: any) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('profile_integrations')
      .upsert(updatedData)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in saveProfileIntegration:', error)
    return { success: false, error }
  }
}

export const fetchGitHubCache = async (username: string) => {
  try {
    const res = await fetch(`/api/github?username=${encodeURIComponent(username)}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load GitHub activity')
    return { success: true, data }
  } catch (error: any) {
    console.error('Error in fetchGitHubCache:', error)
    return { success: false, error: error.message || error }
  }
}

export const subscribeToSpaceEvents = (
  userId: string,
  callbacks: {
    onActivitiesChange: (payload: any) => void
    onProjectsChange: () => void
    onAchievementsChange: (payload: any) => void
    onFocusSessionsChange: () => void
  }
): RealtimeChannel[] => {
  const supabase = createClient()
  
  const activityChannel = supabase
    .channel(`realtime-activities-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: `user_id=eq.${userId}` },
      (payload) => callbacks.onActivitiesChange(payload)
    )
    .subscribe()

  const projectsChannel = supabase
    .channel(`realtime-projects-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects' },
      () => callbacks.onProjectsChange()
    )
    .subscribe()

  const achievementsChannel = supabase
    .channel(`realtime-achievements-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'achievements', filter: `user_id=eq.${userId}` },
      (payload) => callbacks.onAchievementsChange(payload)
    )
    .subscribe()

  const focusChannel = supabase
    .channel(`realtime-focus-sessions-space-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${userId}` },
      () => callbacks.onFocusSessionsChange()
    )
    .subscribe()

  return [activityChannel, projectsChannel, achievementsChannel, focusChannel]
}

export const unsubscribeChannels = async (channels: RealtimeChannel[]) => {
  const supabase = createClient()
  await Promise.all(channels.map(channel => supabase.removeChannel(channel)))
}
