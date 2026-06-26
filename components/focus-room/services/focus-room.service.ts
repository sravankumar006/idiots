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

export const getRoomDetails = async (roomId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_rooms')
      .select('*, profiles:host_user_id(username, avatar)')
      .eq('id', roomId)
      .maybeSingle()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getRoomDetails:', error)
    return { success: false, error }
  }
}

export const getMembers = async (roomId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_room_members')
      .select('*, profiles:user_id(username, avatar)')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getMembers:', error)
    return { success: false, error }
  }
}

export const getComments = async (roomId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_room_comments')
      .select('*, profiles:user_id(username, avatar)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getComments:', error)
    return { success: false, error }
  }
}

export const getInvitations = async (roomId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_room_invitations')
      .select('*, invitee_profile:invitee_user_id(username, avatar)')
      .eq('room_id', roomId)
      .eq('status', 'pending')
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getInvitations:', error)
    return { success: false, error }
  }
}

export const getRoomTimer = async (roomId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_room_timers')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getRoomTimer:', error)
    return { success: false, error }
  }
}

export const toggleReadyStatus = async (memberId: string, currentStatus: string) => {
  try {
    const supabase = createClient()
    const nextStatus = currentStatus === 'ready' ? 'joined' : 'ready'
    const { error } = await supabase
      .from('study_room_members')
      .update({ status: nextStatus })
      .eq('id', memberId)
    if (error) throw error
    return { success: true, data: nextStatus }
  } catch (error) {
    console.error('Error in toggleReadyStatus:', error)
    return { success: false, error }
  }
}

export const postComment = async (roomId: string, userId: string, message: string) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('study_room_comments')
      .insert({
        room_id: roomId,
        user_id: userId,
        message: message.trim()
      })
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in postComment:', error)
    return { success: false, error }
  }
}

export const leaveRoom = async (roomId: string, userId: string) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('study_room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in leaveRoom:', error)
    return { success: false, error }
  }
}

export const completeRoom = async (roomId: string) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('study_rooms')
      .update({
        room_status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', roomId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in completeRoom:', error)
    return { success: false, error }
  }
}

export const startSession = async (roomId: string, durationMinutes: number) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('study_room_timers')
      .upsert({
        room_id: roomId,
        start_time: new Date().toISOString(),
        duration_minutes: durationMinutes,
        status: 'running',
        elapsed_seconds: 0,
        updated_at: new Date().toISOString()
      })
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in startSession:', error)
    return { success: false, error }
  }
}

export const updateTimerStatus = async (
  roomId: string,
  updateData: {
    status: 'paused' | 'running' | 'completed' | 'idle'
    elapsed_seconds?: number
    start_time?: string | null
    duration_minutes?: number
    updated_at: string
  }
) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('study_room_timers')
      .update(updateData)
      .eq('room_id', roomId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in updateTimerStatus:', error)
    return { success: false, error }
  }
}

export const getActiveFocusSession = async (userId: string, roomId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', roomId)
      .eq('completed', false)
      .maybeSingle()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getActiveFocusSession:', error)
    return { success: false, error }
  }
}

export const createFocusSession = async (payload: {
  user_id: string
  goal: string
  duration_minutes: number | null
  actual_minutes: number
  elapsed_seconds: number
  theme: string
  notes: string
  completed: boolean
  group_id: string
}) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in createFocusSession:', error)
    return { success: false, error }
  }
}

export const deleteFocusSession = async (sessionId: string) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('id', sessionId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in deleteFocusSession:', error)
    return { success: false, error }
  }
}

export const updateFocusSessionNotes = async (sessionId: string, notes: string, elapsedSeconds: number) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('focus_sessions')
      .update({ notes, elapsed_seconds: elapsedSeconds })
      .eq('id', sessionId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in updateFocusSessionNotes:', error)
    return { success: false, error }
  }
}

export const saveFocusSessionCompletion = async (
  activeSessionId: string,
  actualMins: number,
  elapsedSeconds: number,
  accomplishments: string,
  reflectionRating: number,
  reflections: string
) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('focus_sessions')
      .update({
        completed: true,
        actual_minutes: actualMins,
        elapsed_seconds: elapsedSeconds,
        accomplishments,
        reflections: `Rating: ${reflectionRating}/10. ${reflections}`,
        completed_at: new Date().toISOString()
      })
      .eq('id', activeSessionId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in saveFocusSessionCompletion:', error)
    return { success: false, error }
  }
}

export const getStudyStats = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error in getStudyStats:', error)
    return { success: false, error }
  }
}

export const updateStudyStats = async (
  userId: string,
  nextMinutes: number,
  nextPomodoros: number
) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('study_stats')
      .update({
        total_study_minutes: nextMinutes,
        completed_pomodoros: nextPomodoros,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error in updateStudyStats:', error)
    return { success: false, error }
  }
}

export const checkOrCreateRoomMembership = async (roomId: string, userId: string) => {
  try {
    const supabase = createClient()
    const { data: existingMember, error: checkError } = await supabase
      .from('study_room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle()

    if (checkError) throw checkError

    if (!existingMember) {
      const { error: insertError } = await supabase.from('study_room_members').insert({
        room_id: roomId,
        user_id: userId,
        is_host: false
      })
      if (insertError) throw insertError
    }

    // Accept pending invitations
    await supabase
      .from('study_room_invitations')
      .update({ status: 'accepted' })
      .eq('room_id', roomId)
      .eq('invitee_user_id', userId)
      .eq('status', 'pending')

    return { success: true }
  } catch (error) {
    console.error('Error in checkOrCreateRoomMembership:', error)
    return { success: false, error }
  }
}

export const setupPresenceChannel = (
  roomId: string,
  userId: string,
  username: string,
  onSync: (userIds: Set<string>) => void
): RealtimeChannel => {
  const supabase = createClient()
  const presenceChannel = supabase.channel(`cabin-presence:${roomId}`, {
    config: {
      presence: {
        key: userId,
      },
    },
  })

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = presenceChannel.presenceState()
      const userIds = new Set<string>(Object.keys(presenceState))
      onSync(userIds)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          userId: userId,
          username: username,
          onlineAt: new Date().toISOString()
        })
      }
    })

  return presenceChannel
}

export const subscribeToRoomChanges = (
  roomId: string,
  callbacks: {
    onRoomDetails: () => void
    onMembers: () => void
    onComments: () => void
    onInvitations: () => void
    onTimer: () => void
  }
): RealtimeChannel => {
  const supabase = createClient()
  return supabase.channel(`cabin-sync:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'study_rooms', filter: `id=eq.${roomId}` },
      () => callbacks.onRoomDetails()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'study_room_members', filter: `room_id=eq.${roomId}` },
      () => callbacks.onMembers()
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'study_room_comments', filter: `room_id=eq.${roomId}` },
      () => callbacks.onComments()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'study_room_invitations', filter: `room_id=eq.${roomId}` },
      () => callbacks.onInvitations()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'study_room_timers', filter: `room_id=eq.${roomId}` },
      () => callbacks.onTimer()
    )
    .subscribe()
}

export const unsubscribeChannel = async (channel: RealtimeChannel) => {
  const supabase = createClient()
  await supabase.removeChannel(channel)
}
