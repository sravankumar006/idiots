import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export const DEFAULT_CAREER_PROFILE = (userId: string) => ({
  id: userId,
  resume_url: '',
  portfolio_url: '',
  certifications: [],
  internship_status: 'applying',
  learning_roadmap: `- [x] Master basic JavaScript and TS
- [/] Build collaborative hub with Supabase
- [ ] Complete 150 LeetCode problems
- [ ] Apply to 10 summer internships`,
  dream_company: '',
  target_goals: [],
  tech_stack: [],
  favorite_language: '',
  achievement_visibility: 'public'
})

export const DEFAULT_CODING_STATS = (userId: string) => ({
  user_id: userId,
  leetcode_username: '',
  leetcode_solved: 0,
  leetcode_streak: 0,
  hackerrank_username: '',
  hackerrank_solved: 0,
  codeforces_username: '',
  codeforces_solved: 0,
  github_username: '',
  github_contributions: 0,
  languages_json: {}
})

export const DEFAULT_STUDY_STATS = (userId: string) => ({
  user_id: userId,
  total_study_minutes: 0,
  completed_pomodoros: 0,
  pdfs_reviewed: 0,
  ai_sessions_count: 0,
  current_streak: 0
})

export const getDashboardData = async (userIdToLoad: string, targetUserId: string | null, userId: string | undefined) => {
  try {
    const supabase = createClient()
    
    // Resolve target user profiles metadata if different
    let profileData = null
    if (targetUserId && targetUserId !== userId) {
      const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle()
      profileData = data
    }

    // Parallel fetch
    const [
      careerRes,
      codingRes,
      studyRes,
      activitiesRes,
      focusRes,
      roadmapRes,
      userAchRes,
      commAchRes
    ] = await Promise.all([
      supabase.from('career_profiles').select('*').eq('id', userIdToLoad).maybeSingle(),
      supabase.from('coding_stats').select('*').eq('user_id', userIdToLoad).maybeSingle(),
      supabase.from('study_stats').select('*').eq('user_id', userIdToLoad).maybeSingle(),
      supabase.from('activity_logs').select('*').eq('user_id', userIdToLoad).order('created_at', { ascending: false }).limit(20),
      supabase.from('focus_sessions').select('*').eq('user_id', userIdToLoad).eq('completed', true).order('created_at', { ascending: false }).limit(1000),
      supabase.from('roadmap_items').select('*').eq('user_id', userIdToLoad).order('display_order', { ascending: true }),
      supabase.from('achievements').select('*, profiles(*)').eq('user_id', userIdToLoad).order('created_at', { ascending: false }),
      supabase.from('achievements').select('*, profiles(*)').neq('user_id', userIdToLoad).order('created_at', { ascending: false }).limit(20)
    ])

    let careerProfile = careerRes.data
    if (!careerProfile && userIdToLoad === userId) {
      const def = DEFAULT_CAREER_PROFILE(userIdToLoad)
      const { data } = await supabase.from('career_profiles').insert(def).select().maybeSingle()
      if (data) careerProfile = data
    }

    let codingStats = codingRes.data
    if (!codingStats && userIdToLoad === userId) {
      const def = DEFAULT_CODING_STATS(userIdToLoad)
      const { data } = await supabase.from('coding_stats').insert(def).select().maybeSingle()
      if (data) codingStats = data
    }

    let studyStats = studyRes.data
    if (!studyStats && userIdToLoad === userId) {
      const def = DEFAULT_STUDY_STATS(userIdToLoad)
      const { data } = await supabase.from('study_stats').insert(def).select().maybeSingle()
      if (data) studyStats = data
    }

    let roadmapItems = roadmapRes.data || []
    if (roadmapItems.length === 0 && userIdToLoad === userId && careerProfile?.learning_roadmap) {
      const lines = careerProfile.learning_roadmap.split('\n').filter(Boolean)
      const newItems = lines.map((line: string, idx: number) => {
        const match = line.match(/^-\s*\[([ x/]+)\]\s*(.*)$/)
        const completed = match ? match[1].toLowerCase().includes('x') : false
        const title = match ? match[2].trim() : line.trim()
        return {
          user_id: userIdToLoad,
          stage: 'General',
          title,
          completed,
          display_order: idx
        }
      }).filter((item: any) => item.title.length > 0)

      if (newItems.length > 0) {
        const { data } = await supabase.from('roadmap_items').insert(newItems).select()
        if (data) roadmapItems = data
      }
    }

    return {
      success: true,
      data: {
        careerProfile,
        codingStats,
        studyStats,
        activities: activitiesRes.data || [],
        focusSessions: focusRes.data || [],
        roadmapItems,
        userAchievements: userAchRes.data || [],
        communityAchievements: commAchRes.data || [],
        targetUserProfile: profileData
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return { success: false, data: null, error }
  }
}

export const getCrewStats = async () => {
  try {
    const supabase = createClient()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const [
      recentFocusRes,
      recentActivityRes,
      recentMessageRes,
      { count: activeSessionsCount },
      { count: completedSessionsCount },
      { count: totalActivitiesCount },
      { count: totalMemoriesCount },
      { count: totalChatMessagesCount },
      { data: weeklySessions }
    ] = await Promise.all([
      supabase.from('focus_sessions').select('user_id').gte('created_at', oneDayAgo),
      supabase.from('activity_logs').select('user_id').gte('created_at', oneDayAgo),
      supabase.from('messages').select('sender_id').gte('created_at', oneDayAgo),
      supabase.from('focus_sessions').select('*', { count: 'exact', head: true }).eq('completed', false),
      supabase.from('focus_sessions').select('*', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('activity_logs').select('*', { count: 'exact', head: true }),
      supabase.from('ai_memories').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('focus_sessions').select('actual_minutes').eq('completed', true).gte('created_at', oneWeekAgo)
    ])

    const activeUserIds = new Set<string>()
    recentFocusRes.data?.forEach(u => activeUserIds.add(u.user_id))
    recentActivityRes.data?.forEach(u => activeUserIds.add(u.user_id))
    recentMessageRes.data?.forEach(u => activeUserIds.add(u.sender_id))

    const totalMinutes = (weeklySessions || []).reduce((acc, s) => acc + (s.actual_minutes || 0), 0)

    return {
      success: true,
      data: {
        weeklyFocusHours: Number((totalMinutes / 60).toFixed(1)),
        activeMembersToday: activeUserIds.size,
        activeSessions: activeSessionsCount || 0,
        completedSessions: completedSessionsCount || 0,
        totalActivities: totalActivitiesCount || 0,
        totalMemories: totalMemoriesCount || 0,
        totalChatMessages: totalChatMessagesCount || 0
      }
    }
  } catch (error) {
    console.error('Error getting crew stats:', error)
    return { success: false, data: null, error }
  }
}

export const updateCareerProfile = async (userId: string, updates: any) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('career_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating career profile:', error)
    return { success: false, error }
  }
}

export const updateCodingStats = async (userId: string, solvedCount: number, streakCount: number, contribCount: number) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('coding_stats')
      .update({
        leetcode_solved: solvedCount,
        leetcode_streak: streakCount,
        github_contributions: contribCount
      })
      .eq('user_id', userId)
      .select()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating coding stats:', error)
    return { success: false, error }
  }
}

export const addActivityLog = async (userId: string, type: string, description: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        activity_type: type,
        description
      })
      .select()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error adding activity log:', error)
    return { success: false, error }
  }
}

export const createAchievement = async (newAch: any) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('achievements')
      .insert(newAch)
      .select('*, profiles(*)')
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating achievement:', error)
    return { success: false, error }
  }
}

export const triggerAchievementNotification = async (payload: {
  userId: string
  title: string
  body: string
  category: string
  type: string
  relatedId: string
}) => {
  try {
    const res = await fetch('/api/notifications/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Notification API returned error')
    return { success: true }
  } catch (error) {
    console.error('Error triggering achievement notification:', error)
    return { success: false, error }
  }
}

export const createRoadmapItem = async (newItem: any) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('roadmap_items')
      .insert(newItem)
      .select()
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating roadmap item:', error)
    return { success: false, error }
  }
}

export const updateRoadmapItem = async (id: string, updates: any) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('roadmap_items')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating roadmap item:', error)
    return { success: false, error }
  }
}

export const deleteRoadmapItem = async (id: string) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('roadmap_items')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting roadmap item:', error)
    return { success: false, error }
  }
}

export const reorderRoadmapItems = async (reordered: { id: string; display_order: number }[]) => {
  try {
    const supabase = createClient()
    const promises = reordered.map(item => 
      supabase
        .from('roadmap_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    )
    await Promise.all(promises)
    return { success: true }
  } catch (error) {
    console.error('Error reordering roadmap items:', error)
    return { success: false, error }
  }
}

export const fetchInvitations = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_room_invitations')
      .select('*, inviter_profile:inviter_user_id(username, avatar), study_rooms:room_id(name, description, host_user_id, is_public)')
      .eq('invitee_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return { success: false, data: null, error }
  }
}

export const acceptInvitation = async (roomId: string, userId: string, invitationId: string) => {
  try {
    const supabase = createClient()
    const { error: joinErr } = await supabase
      .from('study_room_members')
      .insert({
        room_id: roomId,
        user_id: userId,
        is_host: false
      })
    if (joinErr && joinErr.code !== '23505') throw joinErr

    const { error: inviteErr } = await supabase
      .from('study_room_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId)
    if (inviteErr) throw inviteErr

    return { success: true }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return { success: false, error }
  }
}

export const declineInvitation = async (invitationId: string) => {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('study_room_invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error declining invitation:', error)
    return { success: false, error }
  }
}

export const subscribeToInvitations = (userId: string, onUpdate: () => void): RealtimeChannel => {
  const supabase = createClient()
  return supabase
    .channel('dashboard-study-invitations')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'study_room_invitations', filter: `invitee_user_id=eq.${userId}` },
      () => {
        onUpdate()
      }
    )
    .subscribe()
}

export const subscribeToDashboardFocus = (userIdToLoad: string, onUpdate: () => void): RealtimeChannel => {
  const supabase = createClient()
  return supabase
    .channel(`dashboard-focus-realtime:${userIdToLoad}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${userIdToLoad}` },
      () => {
        onUpdate()
      }
    )
    .subscribe()
}

export const unsubscribeChannel = async (channel: RealtimeChannel) => {
  const supabase = createClient()
  await supabase.removeChannel(channel)
}
