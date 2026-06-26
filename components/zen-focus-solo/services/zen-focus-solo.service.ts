import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export const getActiveUserProfile = async (): Promise<{ success: boolean; data: UserProfile | null; error?: any }> => {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!user) return { success: true, data: null }

    const { data: prof, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profError) throw profError
    return { success: true, data: prof as UserProfile }
  } catch (error) {
    console.error('Error fetching active user profile:', error)
    return { success: false, data: null, error }
  }
}

export const getTodayFocusSessions = async (userId: string): Promise<{ success: boolean; data: any[] | null; error?: any }> => {
  try {
    const supabase = createClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('actual_minutes, completed')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
      
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting today focus sessions:', error)
    return { success: false, data: null, error }
  }
}

export const insertFocusSession = async (payload: any): Promise<{ success: boolean; data: any; error?: any }> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(payload)
      .select()
      
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error inserting focus session:', error)
    return { success: false, data: null, error }
  }
}
