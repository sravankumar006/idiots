import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export const getHealthStatus = async () => {
  const res = await fetch('/api/ai/providers/status')
  if (!res.ok) throw new Error('Failed to fetch provider status')
  return res.json()
}

export const getCurrentUser = async () => {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) return { success: true, data: null }
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || 'Explorer',
        avatar: user.user_metadata?.avatar || 'avatar-cyber-ghost',
        created_at: user.created_at,
      }
    }
  } catch (error) {
    console.error('Error fetching current user:', error)
    return { success: false, error }
  }
}

export const getPersonalLogs = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ai_logs')
      .select('*')
      .is('room_id', null)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching personal logs:', error)
    return { success: false, error }
  }
}

export const getAiMemories = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ai_memories')
      .select('*')
      .eq('created_by', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching AI memories:', error)
    return { success: false, error }
  }
}

export const getMemorySummaries = async () => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('memory_summaries')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching memory summaries:', error)
    return { success: false, error }
  }
}

export const getSharedLogs = async () => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ai_logs')
      .select(`
        id,
        prompt,
        response,
        model,
        created_at,
        room_id,
        provider,
        response_time_ms,
        success,
        error_message,
        profiles (
          id,
          username,
          avatar
        ),
        groups (
          id,
          group_name
        )
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching shared logs:', error)
    return { success: false, error }
  }
}

export const getSingleLogWithRelations = async (logId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ai_logs')
      .select(`
        id,
        prompt,
        response,
        model,
        created_at,
        room_id,
        provider,
        response_time_ms,
        success,
        error_message,
        profiles (
          id,
          username,
          avatar
        ),
        groups (
          id,
          group_name
        )
      `)
      .eq('id', logId)
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching single log with relations:', error)
    return { success: false, error }
  }
}

export const subscribeToLogs = (onInsert: (payload: any) => void): RealtimeChannel => {
  const supabase = createClient()
  return supabase
    .channel('ai_logs_realtime_page')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ai_logs' },
      (payload) => {
        onInsert(payload)
      }
    )
    .subscribe()
}

export const unsubscribeChannel = async (channel: RealtimeChannel) => {
  const supabase = createClient()
  await supabase.removeChannel(channel)
}

export const sendChatMessage = async (
  prompt: string,
  groupId: string | null,
  contextMessages: any[],
  providerPreference: string
): Promise<Response> => {
  return fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      groupId,
      contextMessages,
      providerPreference
    })
  })
}
