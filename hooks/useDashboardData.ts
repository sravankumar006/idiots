'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export interface CareerProfile {
  id: string
  resume_url: string | null
  portfolio_url: string | null
  certifications: string[]
  internship_status: string
  learning_roadmap: string
  dream_company: string
  target_goals: string[]
  tech_stack: string[]
  favorite_language: string
  achievement_visibility: string
}

export interface Achievement {
  id: string
  user_id: string
  title: string
  verb: string
  visibility: string
  created_at: string
  profiles?: {
    username: string
    avatar: string
  } | null
}

export interface CodingStats {
  leetcode_username: string
  leetcode_solved: number
  leetcode_streak: number
  hackerrank_username: string
  hackerrank_solved: number
  codeforces_username: string
  codeforces_solved: number
  github_username: string
  github_contributions: number
  languages_json: Record<string, number>
}

export interface StudyStats {
  total_study_minutes: number
  completed_pomodoros: number
  pdfs_reviewed: number
  ai_sessions_count: number
  current_streak: number
}

export interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  description: string
  created_at: string
}

export interface FocusSession {
  id: string
  user_id: string
  goal: string
  duration_minutes: number | null
  actual_minutes: number
  theme: string
  notes: string
  accomplishments: string
  reflections: string
  completed: boolean
  group_id?: string | null
  created_at: string
  completed_at: string | null
}

export interface FocusStats {
  totalHours: number
  totalSessions: number
  weeklyMinutes: number
  monthlyMinutes: number
  collaborativeSessions: number
  streak: number
  goalBreakdown: Record<string, number>
}

export interface CrewStats {
  weeklyFocusHours: number
  activeMembersToday: number
  activeSessions: number
  completedSessions: number
  totalActivities: number
  totalMemories: number
  totalChatMessages: number
}

export interface RoadmapItem {
  id: string
  user_id: string
  stage: string
  title: string
  completed: boolean
  display_order: number
  created_at: string
}

const DEFAULT_CAREER_PROFILE = (userId: string): CareerProfile => ({
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

const DEFAULT_CODING_STATS = (userId: string): CodingStats => ({
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

const DEFAULT_STUDY_STATS = (userId: string): StudyStats => ({
  total_study_minutes: 0,
  completed_pomodoros: 0,
  pdfs_reviewed: 0,
  ai_sessions_count: 0,
  current_streak: 0
})

const DEFAULT_ACTIVITIES = (userId: string): ActivityLog[] => []

const DEFAULT_FOCUS_SESSIONS = (userId: string): FocusSession[] => []

export function useDashboardData(activeUser: UserProfile | null, targetUserId?: string | null) {
  const [loading, setLoading] = useState(true)
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null)
  const [codingStats, setCodingStats] = useState<CodingStats | null>(null)
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([])
  const [focusStats, setFocusStats] = useState<FocusStats>({
    totalHours: 0,
    totalSessions: 0,
    weeklyMinutes: 0,
    monthlyMinutes: 0,
    collaborativeSessions: 0,
    streak: 0,
    goalBreakdown: {}
  })
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)
  const [crewStats, setCrewStats] = useState<CrewStats>({
    weeklyFocusHours: 0,
    activeMembersToday: 0,
    activeSessions: 0,
    completedSessions: 0,
    totalActivities: 0,
    totalMemories: 0,
    totalChatMessages: 0
  })
  const [communityAchievements, setCommunityAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([])

  const supabase = createClient()
  const userId = activeUser?.id

  // Determine active query ID
  const userIdToLoad = targetUserId || userId

  // Compute consecutive study day streaks from completed focus sessions
  const calculateStreak = (sessions: FocusSession[]): number => {
    const completed = sessions.filter(s => s.completed)
    if (completed.length === 0) return 0

    // Get unique dates sorted descending
    const dates = Array.from(new Set(
      completed.map(s => new Date(s.created_at).toDateString())
    )).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime())

    if (dates.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const mostRecent = new Date(dates[0])
    mostRecent.setHours(0, 0, 0, 0)

    // If the most recent session is not today and not yesterday, streak is 0
    if (mostRecent.getTime() !== today.getTime() && mostRecent.getTime() !== yesterday.getTime()) {
      return 0
    }

    let streak = 1
    let currentDate = mostRecent

    for (let i = 1; i < dates.length; i++) {
      const nextDate = new Date(dates[i])
      nextDate.setHours(0, 0, 0, 0)

      const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        streak++
        currentDate = nextDate
      } else if (diffDays > 1) {
        break
      }
    }

    return streak
  }

  // Compute stats from raw sessions list helper
  const computeFocusStats = (sessions: FocusSession[]): FocusStats => {
    const completed = sessions.filter(s => s.completed)
    const totalMins = completed.reduce((acc, s) => acc + s.actual_minutes, 0)
    const nowTime = Date.now()
    const oneWeekAgo = nowTime - 7 * 24 * 60 * 60 * 1000
    const oneMonthAgo = nowTime - 30 * 24 * 60 * 60 * 1000

    let weeklyMins = 0
    let monthlyMins = 0
    let collaborativeCount = 0
    const breakdown: Record<string, number> = {}

    completed.forEach(s => {
      const time = new Date(s.created_at).getTime()
      if (time >= oneWeekAgo) weeklyMins += s.actual_minutes
      if (time >= oneMonthAgo) monthlyMins += s.actual_minutes
      if (s.group_id) collaborativeCount++

      const goalKey = s.goal || 'General'
      breakdown[goalKey] = (breakdown[goalKey] || 0) + 1
    })

    return {
      totalHours: Number((totalMins / 60).toFixed(1)),
      totalSessions: completed.length,
      weeklyMinutes: weeklyMins,
      monthlyMinutes: monthlyMins,
      collaborativeSessions: collaborativeCount,
      streak: calculateStreak(sessions),
      goalBreakdown: breakdown
    }
  }

  // 1. Fetch Dashboard Data
  const fetchData = useCallback(async () => {
    if (!userIdToLoad) return
    setLoading(true)

    // Local Storage Mock Keys
    const careerKey = `mock_career_profile_${userIdToLoad}`
    const codingKey = `mock_coding_stats_${userIdToLoad}`
    const studyKey = `mock_study_stats_${userIdToLoad}`
    const activitiesKey = `mock_activities_${userIdToLoad}`
    const focusKey = `mock_focus_sessions_${userIdToLoad}`

    try {
      const promises: any[] = [
        supabase.from('career_profiles').select('*').eq('id', userIdToLoad).maybeSingle(),
        supabase.from('coding_stats').select('*').eq('user_id', userIdToLoad).maybeSingle(),
        supabase.from('study_stats').select('*').eq('user_id', userIdToLoad).maybeSingle(),
        supabase.from('activity_logs').select('*').eq('user_id', userIdToLoad).order('created_at', { ascending: false }).limit(20),
        supabase.from('focus_sessions').select('*').eq('user_id', userIdToLoad).eq('completed', true).order('created_at', { ascending: false }).limit(1000),
        supabase.from('roadmap_items').select('*').eq('user_id', userIdToLoad).order('display_order', { ascending: true }),
        supabase.from('achievements').select('*, profiles(*)').eq('user_id', userIdToLoad).order('created_at', { ascending: false }),
        supabase.from('achievements').select('*, profiles(*)').neq('user_id', userIdToLoad).order('created_at', { ascending: false }).limit(20)
      ]

      // Fetch target user profiles metadata if different
      if (targetUserId && targetUserId !== userId) {
        promises.push(supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle())
      }

      const [
        careerRes, codingRes, studyRes, activitiesRes, focusRes, roadmapRes,
        userAchRes, commAchRes, profileRes
      ] = await Promise.all(promises)

      // Set target user details
      if (profileRes && profileRes.data) {
        setTargetUser(profileRes.data as UserProfile)
      } else {
        setTargetUser(activeUser)
      }

      // Profile handle
      let careerProfileData: CareerProfile | null = null
      if (careerRes.error) throw careerRes.error
      if (careerRes.data) {
        careerProfileData = careerRes.data as CareerProfile
      } else {
        // Create initial record (only if it is current user)
        const def = DEFAULT_CAREER_PROFILE(userIdToLoad)
        if (userIdToLoad === userId) {
          await supabase.from('career_profiles').insert(def)
        }
        careerProfileData = def
      }
      setCareerProfile(careerProfileData)

      // Coding Stats handle
      if (codingRes.error) throw codingRes.error
      if (codingRes.data) {
        setCodingStats(codingRes.data as CodingStats)
      } else {
        const def = DEFAULT_CODING_STATS(userIdToLoad)
        if (userIdToLoad === userId) {
          await supabase.from('coding_stats').insert({ user_id: userIdToLoad, ...def })
        }
        setCodingStats(def)
      }

      // Focus Sessions handle
      let finalFocusSessions: FocusSession[] = []
      let finalFocusStats: FocusStats = {
        totalHours: 0,
        totalSessions: 0,
        weeklyMinutes: 0,
        monthlyMinutes: 0,
        collaborativeSessions: 0,
        streak: 0,
        goalBreakdown: {}
      }

      if (focusRes.error) throw focusRes.error
      if (focusRes.data && focusRes.data.length > 0) {
        finalFocusSessions = focusRes.data as FocusSession[]
        finalFocusStats = computeFocusStats(finalFocusSessions)
      } else {
        const def = DEFAULT_FOCUS_SESSIONS(userIdToLoad)
        finalFocusSessions = def
        finalFocusStats = computeFocusStats(def)
      }
      setFocusSessions(finalFocusSessions)
      setFocusStats(finalFocusStats)

      // Study Stats handle - override streak and completed sessions with real calculated stats!
      if (studyRes.error) throw studyRes.error
      let studyStatsData: StudyStats
      if (studyRes.data) {
        studyStatsData = studyRes.data as StudyStats
      } else {
        studyStatsData = DEFAULT_STUDY_STATS(userIdToLoad)
        if (userIdToLoad === userId) {
          await supabase.from('study_stats').insert({ user_id: userIdToLoad, ...studyStatsData })
        }
      }
      // Overwrite with real database activity stats
      studyStatsData.completed_pomodoros = finalFocusStats.totalSessions
      studyStatsData.current_streak = finalFocusStats.streak
      setStudyStats(studyStatsData)

      // Activities handle
      if (activitiesRes.error) throw activitiesRes.error
      if (activitiesRes.data && activitiesRes.data.length > 0) {
        setActivities(activitiesRes.data as ActivityLog[])
      } else {
        const def = DEFAULT_ACTIVITIES(userIdToLoad)
        if (userIdToLoad === userId) {
          await supabase.from('activity_logs').insert(def)
        }
        setActivities(def)
      }

      // Roadmap Items handle - with auto-migration from careerProfile markdown roadmap
      if (roadmapRes.error) throw roadmapRes.error
      let finalRoadmapItems: RoadmapItem[] = []
      if (roadmapRes.data && roadmapRes.data.length > 0) {
        finalRoadmapItems = roadmapRes.data as RoadmapItem[]
      } else {
        // If empty, check if we can migrate from careerProfile markdown roadmap
        if (careerProfileData && careerProfileData.learning_roadmap) {
          const lines = careerProfileData.learning_roadmap.split('\n').filter(Boolean)
          const newItems = lines.map((line, idx) => {
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
          }).filter(item => item.title.length > 0)

          if (newItems.length > 0 && userIdToLoad === userId) {
            const { data: inserted } = await supabase.from('roadmap_items').insert(newItems).select()
            if (inserted) {
              finalRoadmapItems = inserted as RoadmapItem[]
            }
          }
        }
      }
      setRoadmapItems(finalRoadmapItems)

      // User Achievements handle
      let finalUserAchievements: Achievement[] = []
      if (userAchRes && !userAchRes.error && userAchRes.data) {
        finalUserAchievements = userAchRes.data as Achievement[]
      }
      setUserAchievements(finalUserAchievements)

      // Community Achievements handle
      let finalCommAchievements: Achievement[] = []
      if (commAchRes && !commAchRes.error && commAchRes.data) {
        finalCommAchievements = commAchRes.data as Achievement[]
      }
      setCommunityAchievements(finalCommAchievements)

      // Auto-detect Achievements
      if (userIdToLoad === userId) {
        const currentVisibility = careerProfileData?.achievement_visibility || 'public'
        await checkAndTriggerAchievements(
          userIdToLoad,
          finalFocusStats,
          finalRoadmapItems,
          finalUserAchievements,
          currentVisibility
        )
      }

      // Fetch crew stats (platform-wide)
      let crewStatsData: CrewStats = {
        weeklyFocusHours: 0,
        activeMembersToday: 0,
        activeSessions: 0,
        completedSessions: 0,
        totalActivities: 0,
        totalMemories: 0,
        totalChatMessages: 0
      }

      try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

        // 1. Weekly focus hours (all users, last 7 days)
        const { data: weeklySessions } = await supabase
          .from('focus_sessions')
          .select('actual_minutes')
          .eq('completed', true)
          .gte('created_at', oneWeekAgo.toISOString())
        const weeklyMinutes = weeklySessions?.reduce((acc, s) => acc + s.actual_minutes, 0) || 0
        crewStatsData.weeklyFocusHours = Number((weeklyMinutes / 60).toFixed(1))

        // 2. Active members today (all users, last 24 hours)
        const [recentFocusUsers, recentActivityUsers, recentMessageUsers] = await Promise.all([
          supabase.from('focus_sessions').select('user_id').gte('created_at', oneDayAgo.toISOString()),
          supabase.from('activity_logs').select('user_id').gte('created_at', oneDayAgo.toISOString()),
          supabase.from('messages').select('sender_id').gte('created_at', oneDayAgo.toISOString())
        ])

        const activeUserIds = new Set<string>()
        recentFocusUsers.data?.forEach(u => activeUserIds.add(u.user_id))
        recentActivityUsers.data?.forEach(u => activeUserIds.add(u.user_id))
        recentMessageUsers.data?.forEach(u => activeUserIds.add(u.sender_id))
        crewStatsData.activeMembersToday = activeUserIds.size

        // 3. Active focus sessions
        const { count: activeSessions } = await supabase
          .from('focus_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('completed', false)
        crewStatsData.activeSessions = activeSessions || 0

        // 4. Completed focus sessions
        const { count: completedSessions } = await supabase
          .from('focus_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('completed', true)
        crewStatsData.completedSessions = completedSessions || 0

        // 5. Total timeline activity
        const { count: totalActivities } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
        crewStatsData.totalActivities = totalActivities || 0

        // 6. Total memories
        const { count: totalMemories } = await supabase
          .from('ai_memories')
          .select('*', { count: 'exact', head: true })
        crewStatsData.totalMemories = totalMemories || 0

        // 7. Total chat messages
        const { count: totalChatMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
        crewStatsData.totalChatMessages = totalChatMessages || 0

      } catch (err) {
        console.warn("Failed to fetch crew stats from DB:", err)
      }

      setCrewStats(crewStatsData)

    } catch (err: any) {
      console.warn("DB Dashboard Fetch failed (switching to localStorage fallback):", err.message)
      
      // Set fallback target user metadata
      if (targetUserId && targetUserId !== userId) {
        setTargetUser({
          id: targetUserId,
          username: `Explorer_${targetUserId.slice(0, 4)}`,
          email: 'explorer@system.local',
          avatar: 'avatar-neon-pulse',
          created_at: new Date().toISOString()
        })
      } else {
        setTargetUser(activeUser)
      }

      // Load from LocalStorage or write defaults if empty
      let localCP = localStorage.getItem(careerKey)
      if (localCP) {
        setCareerProfile(JSON.parse(localCP))
      } else {
        const def = DEFAULT_CAREER_PROFILE(userIdToLoad)
        localStorage.setItem(careerKey, JSON.stringify(def))
        setCareerProfile(def)
      }

      let localCS = localStorage.getItem(codingKey)
      if (localCS) {
        setCodingStats(JSON.parse(localCS))
      } else {
        const def = DEFAULT_CODING_STATS(userIdToLoad)
        localStorage.setItem(codingKey, JSON.stringify(def))
        setCodingStats(def)
      }

      let localFocus = localStorage.getItem(focusKey)
      let finalFocusSessions: FocusSession[] = []
      let finalFocusStats: FocusStats = {
        totalHours: 0,
        totalSessions: 0,
        weeklyMinutes: 0,
        monthlyMinutes: 0,
        collaborativeSessions: 0,
        streak: 0,
        goalBreakdown: {}
      }

      if (localFocus) {
        finalFocusSessions = JSON.parse(localFocus) as FocusSession[]
      } else {
        finalFocusSessions = DEFAULT_FOCUS_SESSIONS(userIdToLoad)
        localStorage.setItem(focusKey, JSON.stringify(finalFocusSessions))
      }
      finalFocusStats = computeFocusStats(finalFocusSessions)
      setFocusSessions(finalFocusSessions)
      setFocusStats(finalFocusStats)

      let localSS = localStorage.getItem(studyKey)
      let studyStatsData: StudyStats
      if (localSS) {
        studyStatsData = JSON.parse(localSS) as StudyStats
      } else {
        studyStatsData = DEFAULT_STUDY_STATS(userIdToLoad)
      }
      studyStatsData.completed_pomodoros = finalFocusStats.totalSessions
      studyStatsData.current_streak = finalFocusStats.streak
      localStorage.setItem(studyKey, JSON.stringify(studyStatsData))
      setStudyStats(studyStatsData)

      let localAct = localStorage.getItem(activitiesKey)
      if (localAct) {
        setActivities(JSON.parse(localAct))
      } else {
        const def = DEFAULT_ACTIVITIES(userIdToLoad)
        localStorage.setItem(activitiesKey, JSON.stringify(def))
        setActivities(def)
      }

      // LocalStorage fallback for roadmap items
      const localRoadmap = localStorage.getItem(`mock_roadmap_items_${userIdToLoad}`)
      let finalRoadmapItems: RoadmapItem[] = []
      if (localRoadmap) {
        finalRoadmapItems = JSON.parse(localRoadmap) as RoadmapItem[]
      } else {
        // Initialize from careerProfile markdown roadmap
        const profileData = localCP ? (JSON.parse(localCP) as CareerProfile) : DEFAULT_CAREER_PROFILE(userIdToLoad)
        const lines = (profileData.learning_roadmap || '').split('\n').filter(Boolean)
        finalRoadmapItems = lines.map((line, idx) => {
          const match = line.match(/^-\s*\[([ x/]+)\]\s*(.*)$/)
          const completed = match ? match[1].toLowerCase().includes('x') : false
          const title = match ? match[2].trim() : line.trim()
          return {
            id: `roadmap-${idx}-${Date.now()}`,
            user_id: userIdToLoad,
            stage: 'General',
            title,
            completed,
            display_order: idx,
            created_at: new Date().toISOString()
          }
        }).filter(item => item.title.length > 0)
        localStorage.setItem(`mock_roadmap_items_${userIdToLoad}`, JSON.stringify(finalRoadmapItems))
      }
      setRoadmapItems(finalRoadmapItems)

      // LocalStorage fallback for achievements
      const localAchKey = `mock_achievements_${userIdToLoad}`
      const localAchs = localStorage.getItem(localAchKey)
      let finalUserAchievements: Achievement[] = []
      if (localAchs) {
        finalUserAchievements = JSON.parse(localAchs) as Achievement[]
      }
      setUserAchievements(finalUserAchievements)
      setCommunityAchievements(finalUserAchievements.filter(a => a.visibility !== 'private'))

      // LocalStorage fallback for crew stats
      const oneWeekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000
      const oneDayAgoMs = Date.now() - 24 * 60 * 60 * 1000
      
      const parsedFocus = finalFocusSessions
      const parsedAct = localAct ? (JSON.parse(localAct) as ActivityLog[]) : []

      const weeklyMinutes = parsedFocus
        .filter(s => s.completed && new Date(s.created_at).getTime() >= oneWeekAgoMs)
        .reduce((acc, s) => acc + s.actual_minutes, 0)
      
      const activeMembersSet = new Set<string>()
      parsedFocus.forEach(s => {
        if (new Date(s.created_at).getTime() >= oneDayAgoMs) activeMembersSet.add(s.user_id)
      })
      parsedAct.forEach(a => {
        if (new Date(a.created_at).getTime() >= oneDayAgoMs) activeMembersSet.add(a.user_id)
      })

      setCrewStats({
        weeklyFocusHours: Number((weeklyMinutes / 60).toFixed(1)),
        activeMembersToday: activeMembersSet.size,
        activeSessions: parsedFocus.filter(s => !s.completed).length,
        completedSessions: parsedFocus.filter(s => s.completed).length,
        totalActivities: parsedAct.length,
        totalMemories: 0,
        totalChatMessages: 0
      })
    } finally {
      setLoading(false)
    }
  }, [userIdToLoad, userId, targetUserId, activeUser, supabase])

  useEffect(() => {
    if (userIdToLoad) {
      fetchData()
    }
  }, [userIdToLoad, fetchData])

  // Subscribe to realtime focus session changes to keep stats synchronized
  useEffect(() => {
    if (!userIdToLoad) return

    const channel = supabase
      .channel(`dashboard-focus-realtime:${userIdToLoad}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${userIdToLoad}` },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userIdToLoad, fetchData, supabase])

  // 2. Update Career Profile (Disabled in Read-only)
  const updateCareerProfile = async (updates: Partial<CareerProfile>) => {
    if (targetUserId && targetUserId !== userId) return
    if (!userId || !careerProfile) return

    const nextCP = { ...careerProfile, ...updates }
    setCareerProfile(nextCP)

    // Sync to DB
    try {
      const { error } = await supabase
        .from('career_profiles')
        .update(updates)
        .eq('id', userId)
      if (error) throw error
    } catch (err: any) {
      console.warn("DB Update Career Profile failed, using localStorage fallback:", err.message)
      localStorage.setItem(`mock_career_profile_${userId}`, JSON.stringify(nextCP))
    }
  }

  // 3. Sync/Simulate Coding Platform update (Disabled in Read-only)
  const syncCodingPlatform = async () => {
    if (targetUserId && targetUserId !== userId) return
    if (!userId || !codingStats) return

    // Simulate solved problems & contributions addition
    const addedSolved = Math.floor(Math.random() * 3) + 1
    const addedContrib = Math.floor(Math.random() * 5) + 1
    
    const nextCS: CodingStats = {
      ...codingStats,
      leetcode_solved: codingStats.leetcode_solved + addedSolved,
      leetcode_streak: codingStats.leetcode_streak + 1,
      github_contributions: codingStats.github_contributions + addedContrib
    }
    
    setCodingStats(nextCS)
    
    // Add activity log
    await addActivityLog(
      'coding_solve',
      `Synced coding progress: solved ${addedSolved} LeetCode problems & pushed ${addedContrib} GitHub contributions`
    )

    // Sync to DB
    try {
      const { error } = await supabase
        .from('coding_stats')
        .update({
          leetcode_solved: nextCS.leetcode_solved,
          leetcode_streak: nextCS.leetcode_streak,
          github_contributions: nextCS.github_contributions
        })
        .eq('user_id', userId)
      if (error) throw error
    } catch (err: any) {
      console.warn("DB Update Coding Stats failed, using localStorage fallback:", err.message)
      localStorage.setItem(`mock_coding_stats_${userId}`, JSON.stringify(nextCS))
    }
  }

  // 4. Add Activity Log (Disabled in Read-only)
  const addActivityLog = async (type: string, description: string) => {
    if (targetUserId && targetUserId !== userId) return
    if (!userId) return

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      user_id: userId,
      activity_type: type,
      description,
      created_at: new Date().toISOString()
    }

    setActivities((prev) => [newLog, ...prev])

    // Save to DB
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          activity_type: type,
          description
        })
      if (error) throw error
    } catch (err: any) {
      console.warn("DB Insert Activity Log failed, using localStorage fallback:", err.message)
      const activitiesKey = `mock_activities_${userId}`
      const current = JSON.parse(localStorage.getItem(activitiesKey) || '[]')
      const updated = [newLog, ...current].slice(0, 30) // cap to 30
      localStorage.setItem(activitiesKey, JSON.stringify(updated))
    }
  }

  // Create Achievement
  const createAchievement = async (uid: string, title: string, verb: string, visibility: string) => {
    const newAch = {
      user_id: uid,
      title,
      verb,
      visibility
    }

    try {
      const { data, error } = await supabase
        .from('achievements')
        .insert(newAch)
        .select('*, profiles(*)')
        .single()
      
      if (error) throw error
      if (data) {
        setUserAchievements(prev => [data as Achievement, ...prev])
        if (visibility !== 'private') {
          setCommunityAchievements(prev => [data as Achievement, ...prev])
        }

        // Trigger notification
        fetch('/api/notifications/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: uid,
            title: 'achievement unlocked! 🏆',
            body: `you ${verb} ${title}`,
            category: 'achievement',
            type: 'milestone',
            relatedId: data.id
          })
        }).catch(err => console.error('Failed to trigger achievement notification:', err))

        return data as Achievement
      }
    } catch (err: any) {
      console.warn("DB Create Achievement failed, using localStorage fallback:", err.message)
      const mockAch: Achievement = {
        id: `ach-${Date.now()}`,
        user_id: uid,
        title,
        verb,
        visibility,
        created_at: new Date().toISOString(),
        profiles: activeUser ? { username: activeUser.username, avatar: activeUser.avatar } : null
      }
      setUserAchievements(prev => [mockAch, ...prev])
      if (visibility !== 'private') {
        setCommunityAchievements(prev => [mockAch, ...prev])
      }

      // Trigger notification for mocked achievement
      fetch('/api/notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          title: 'achievement unlocked! 🏆',
          body: `you ${verb} ${title}`,
          category: 'achievement',
          type: 'milestone',
          relatedId: mockAch.id
        })
      }).catch(err => console.error('Failed to trigger mock achievement notification:', err))

      const localKey = `mock_achievements_${uid}`
      const current = JSON.parse(localStorage.getItem(localKey) || '[]')
      localStorage.setItem(localKey, JSON.stringify([mockAch, ...current]))
      return mockAch
    }
    return null
  }

  // Check and trigger achievements helper
  const checkAndTriggerAchievements = useCallback(async (
    uid: string,
    stats: FocusStats,
    roadmap: RoadmapItem[],
    existing: Achievement[],
    visibility: string
  ) => {
    if (targetUserId && targetUserId !== userId) return

    // 1. Check 20 Focus Sessions
    if (stats.totalSessions >= 20) {
      const has20 = existing.some(a => a.title === '20 Focus Sessions')
      if (!has20) {
        await createAchievement(uid, '20 Focus Sessions', 'completed', visibility)
      }
    }

    // 2. Check 50 Study Hours
    if (stats.totalHours >= 50) {
      const has50 = existing.some(a => a.title === '50 Study Hours')
      if (!has50) {
        await createAchievement(uid, '50 Study Hours', 'reached', visibility)
      }
    }

    // 3. Check Roadmap completion
    const totalGoals = roadmap.length
    const completedGoals = roadmap.filter(r => r.completed).length
    if (totalGoals > 0 && completedGoals === totalGoals) {
      const title = 'Learning Roadmap'
      const hasRoadmap = existing.some(a => a.title === title)
      if (!hasRoadmap) {
        await createAchievement(uid, title, 'completed', visibility)
      }
    }
  }, [activeUser, targetUserId, userId, roadmapItems])

  // 5. Create Roadmap Item
  const createRoadmapItem = async (stage: string, title: string) => {
    if (targetUserId && targetUserId !== userId) return null
    if (!userId) return null

    const maxOrder = roadmapItems.reduce((max, item) => Math.max(max, item.display_order), -1)
    const newItem: Omit<RoadmapItem, 'id' | 'created_at'> & { id?: string; created_at?: string } = {
      user_id: userId,
      stage,
      title,
      completed: false,
      display_order: maxOrder + 1
    }

    try {
      const { data, error } = await supabase
        .from('roadmap_items')
        .insert(newItem)
        .select()
        .single()
      
      if (error) throw error
      if (data) {
        setRoadmapItems(prev => [...prev, data as RoadmapItem])
        return data as RoadmapItem
      }
    } catch (err: any) {
      console.warn("DB Create Roadmap Item failed, using localStorage fallback:", err.message)
      const mockItem: RoadmapItem = {
        id: `roadmap-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...newItem
      }
      const updated = [...roadmapItems, mockItem]
      setRoadmapItems(updated)
      localStorage.setItem(`mock_roadmap_items_${userId}`, JSON.stringify(updated))
      return mockItem
    }
    return null
  }

  // 6. Update Roadmap Item
  const updateRoadmapItem = async (id: string, updates: Partial<RoadmapItem>) => {
    if (targetUserId && targetUserId !== userId) return
    if (!userId) return

    const updated = roadmapItems.map(item => item.id === id ? { ...item, ...updates } : item)
    setRoadmapItems(updated)

    try {
      const { error } = await supabase
        .from('roadmap_items')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    } catch (err: any) {
      console.warn("DB Update Roadmap Item failed, using localStorage fallback:", err.message)
      localStorage.setItem(`mock_roadmap_items_${userId}`, JSON.stringify(updated))
    }
  }

  // 7. Delete Roadmap Item
  const deleteRoadmapItem = async (id: string) => {
    if (targetUserId && targetUserId !== userId) return
    if (!userId) return

    const updated = roadmapItems.filter(item => item.id !== id)
    setRoadmapItems(updated)

    try {
      const { error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', id)
      if (error) throw error
    } catch (err: any) {
      console.warn("DB Delete Roadmap Item failed, using localStorage fallback:", err.message)
      localStorage.setItem(`mock_roadmap_items_${userId}`, JSON.stringify(updated))
    }
  }

  // 8. Reorder Roadmap Items
  const reorderRoadmapItems = async (reordered: RoadmapItem[]) => {
    if (targetUserId && targetUserId !== userId) return
    if (!userId) return

    setRoadmapItems(reordered)

    try {
      const promises = reordered.map(item => 
        supabase
          .from('roadmap_items')
          .update({ display_order: item.display_order })
          .eq('id', item.id)
      )
      await Promise.all(promises)
    } catch (err: any) {
      console.warn("DB Reorder Roadmap Items failed, using localStorage fallback:", err.message)
      localStorage.setItem(`mock_roadmap_items_${userId}`, JSON.stringify(reordered))
    }
  }

  return {
    loading,
    careerProfile,
    codingStats,
    studyStats,
    activities,
    focusSessions,
    focusStats,
    targetUser,
    crewStats,
    roadmapItems,
    createRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    reorderRoadmapItems,
    updateCareerProfile,
    syncCodingPlatform,
    addActivityLog,
    communityAchievements,
    userAchievements,
    createAchievement,
    refetch: fetchData
  }
}
