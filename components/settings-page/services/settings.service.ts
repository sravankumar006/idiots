import { createClient } from '@/lib/supabase/client'

export const getCurrentUser = async (): Promise<{ success: boolean; data: any; error?: any }> => {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { success: true, data: user }
  } catch (error) {
    console.error('Error fetching current user:', error)
    return { success: false, data: null, error }
  }
}

export const fetchDeviceStatus = async (userId: string): Promise<{ success: boolean; data: any[] | null; error?: any }> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_devices')
      .select('id, fcm_token, created_at, platform')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching device status:', error)
    return { success: false, data: null, error }
  }
}

export const fetchNotificationConfig = async (): Promise<{ success: boolean; data: any; error?: any }> => {
  try {
    const res = await fetch('/api/notifications/config')
    if (!res.ok) throw new Error('Failed to fetch notification config')
    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching notification config:', error)
    return { success: false, data: null, error }
  }
}

export const getNotificationPreferences = async (): Promise<{ success: boolean; data: any; error?: any }> => {
  try {
    const res = await fetch('/api/notifications/preferences')
    if (!res.ok) throw new Error('Failed to load notification preferences')
    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, data: null, error }
  }
}

export const getProvidersStatus = async (): Promise<{ success: boolean; data: any; error?: any }> => {
  try {
    const res = await fetch('/api/ai/providers/status')
    if (!res.ok) throw new Error('Failed to load provider status')
    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, data: null, error }
  }
}

export const saveNotificationPreferences = async (prefs: {
  chat_enabled: boolean
  focus_enabled: boolean
  ai_enabled: boolean
  memory_enabled: boolean
  achievement_enabled: boolean
}): Promise<{ success: boolean; data: any; error?: any }> => {
  try {
    const res = await fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prefs)
    })
    if (!res.ok) throw new Error('Failed to save notification settings')
    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, data: null, error }
  }
}

export const triggerTestNotification = async (payload: {
  userId: string
  title: string
  body: string
  category: string
  type: string
}): Promise<{ success: boolean; data: any; error?: any }> => {
  try {
    const res = await fetch('/api/notifications/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to trigger test notification')
    }
    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, data: null, error }
  }
}

export const clearMemory = async (type: string, userId: string): Promise<{ success: boolean; error?: any }> => {
  try {
    const supabase = createClient()
    if (type === 'Current Session') {
      return { success: true }
    } else if (type === 'Conversation Memory') {
      const { error } = await supabase.from('memory_summaries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
    } else if (type === 'Project Memory') {
      const { error } = await supabase.from('ai_memories').delete().eq('created_by', userId).eq('memory_type', 'Project')
      if (error) throw error
    } else if (type === 'Study Memory') {
      const { error } = await supabase.from('ai_memories').delete().eq('created_by', userId).eq('memory_type', 'Study')
      if (error) throw error
    } else if (type === 'All AI Memory') {
      const { error: err1 } = await supabase.from('ai_memories').delete().eq('created_by', userId)
      if (err1) throw err1
      const { error: err2 } = await supabase.from('memory_summaries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (err2) throw err2
    }
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error }
  }
}
