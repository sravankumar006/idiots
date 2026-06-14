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
  created_at: string
  completed_at: string | null
}

export interface FocusStats {
  totalHours: number
  totalSessions: number
  weeklyMinutes: number
  monthlyMinutes: number
}

const DEFAULT_CAREER_PROFILE = (userId: string): CareerProfile => ({
  id: userId,
  resume_url: '',
  portfolio_url: '',
  certifications: ['AWS Cloud Practitioner', 'Next.js Professional'],
  internship_status: 'applying',
  learning_roadmap: `- [x] Master basic JavaScript and TS
- [/] Build collaborative hub with Supabase
- [ ] Complete 150 LeetCode problems
- [ ] Apply to 10 summer internships`,
  dream_company: 'Google',
  target_goals: ['Solve 200 DSA problems', 'Build 3 Fullstack projects', 'Resume review with crew'],
  tech_stack: ['Next.js', 'TypeScript', 'Supabase', 'React', 'TailwindCSS'],
  favorite_language: 'TypeScript'
})

const DEFAULT_CODING_STATS = (userId: string): CodingStats => ({
  leetcode_username: 'idiot_dev',
  leetcode_solved: 84,
  leetcode_streak: 5,
  hackerrank_username: 'idiot_hack',
  hackerrank_solved: 25,
  codeforces_username: 'idiot_cf',
  codeforces_solved: 12,
  github_username: 'idiot_coder',
  github_contributions: 147,
  languages_json: { 'TypeScript': 50, 'JavaScript': 30, 'C++': 15, 'Python': 5 }
})

const DEFAULT_STUDY_STATS = (userId: string): StudyStats => ({
  total_study_minutes: 360,
  completed_pomodoros: 12,
  pdfs_reviewed: 3,
  ai_sessions_count: 8,
  current_streak: 4
})

const DEFAULT_ACTIVITIES = (userId: string): ActivityLog[] => [
  {
    id: 'act-1',
    user_id: userId,
    activity_type: 'study_session',
    description: 'Completed a 45-minute focus study session',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    id: 'act-2',
    user_id: userId,
    activity_type: 'coding_solve',
    description: 'Solved 3 LeetCode problems (TypeScript)',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    id: 'act-3',
    user_id: userId,
    activity_type: 'career_update',
    description: 'Updated learning roadmap and dream company',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
  }
]

const DEFAULT_FOCUS_SESSIONS = (userId: string): FocusSession[] => [
  {
    id: 'fs-1',
    user_id: userId,
    goal: 'Coding',
    duration_minutes: 45,
    actual_minutes: 45,
    theme: 'coding_cave',
    notes: 'Implemented the new grid layout for the dashboard. Added Tailwind styling.',
    accomplishments: 'Completed dashboard components & styled them.',
    reflections: 'Felt very focused. Coding cave theme matches coding headspace.',
    completed: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 2 + 45 * 60000).toISOString()
  },
  {
    id: 'fs-2',
    user_id: userId,
    goal: 'Research',
    duration_minutes: 60,
    actual_minutes: 60,
    theme: 'aurora',
    notes: 'Researched Supabase RLS policies and channel replication details.',
    accomplishments: 'Mapped out migration scripts.',
    reflections: 'A bit distracted by notifications in the middle.',
    completed: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 24 + 60 * 60000).toISOString()
  }
]

export function useDashboardData(activeUser: UserProfile | null, targetUserId?: string | null) {
  const [loading, setLoading] = useState(true)
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null)
  const [codingStats, setCodingStats] = useState<CodingStats | null>(null)
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([])
  const [focusStats, setFocusStats] = useState<FocusStats>({ totalHours: 0, totalSessions: 0, weeklyMinutes: 0, monthlyMinutes: 0 })
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)

  const supabase = createClient()
  const userId = activeUser?.id

  // Determine active query ID
  const userIdToLoad = targetUserId || userId

  // Compute stats from raw sessions list helper
  const computeFocusStats = (sessions: FocusSession[]): FocusStats => {
    const totalMins = sessions.reduce((acc, s) => acc + s.actual_minutes, 0)
    const nowTime = Date.now()
    const oneWeekAgo = nowTime - 7 * 24 * 60 * 60 * 1000
    const oneMonthAgo = nowTime - 30 * 24 * 60 * 60 * 1000

    let weeklyMins = 0
    let monthlyMins = 0

    sessions.forEach(s => {
      const time = new Date(s.created_at).getTime()
      if (time >= oneWeekAgo) weeklyMins += s.actual_minutes
      if (time >= oneMonthAgo) monthlyMins += s.actual_minutes
    })

    return {
      totalHours: Number((totalMins / 60).toFixed(1)),
      totalSessions: sessions.length,
      weeklyMinutes: weeklyMins,
      monthlyMinutes: monthlyMins
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
        supabase.from('focus_sessions').select('*').eq('user_id', userIdToLoad).eq('completed', true).order('created_at', { ascending: false }).limit(30)
      ]

      // Fetch target user profiles metadata if different
      if (targetUserId && targetUserId !== userId) {
        promises.push(supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle())
      }

      const [careerRes, codingRes, studyRes, activitiesRes, focusRes, profileRes] = await Promise.all(promises)

      // Set target user details
      if (profileRes && profileRes.data) {
        setTargetUser(profileRes.data as UserProfile)
      } else {
        setTargetUser(activeUser)
      }

      // Profile handle
      if (careerRes.error) throw careerRes.error
      if (careerRes.data) {
        setCareerProfile(careerRes.data as CareerProfile)
      } else {
        // Create initial record (only if it is current user)
        const def = DEFAULT_CAREER_PROFILE(userIdToLoad)
        if (userIdToLoad === userId) {
          await supabase.from('career_profiles').insert(def)
        }
        setCareerProfile(def)
      }

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

      // Study Stats handle
      if (studyRes.error) throw studyRes.error
      if (studyRes.data) {
        setStudyStats(studyRes.data as StudyStats)
      } else {
        const def = DEFAULT_STUDY_STATS(userIdToLoad)
        if (userIdToLoad === userId) {
          await supabase.from('study_stats').insert({ user_id: userIdToLoad, ...def })
        }
        setStudyStats(def)
      }

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

      // Focus Sessions handle
      if (focusRes.error) throw focusRes.error
      if (focusRes.data && focusRes.data.length > 0) {
        setFocusSessions(focusRes.data as FocusSession[])
        setFocusStats(computeFocusStats(focusRes.data as FocusSession[]))
      } else {
        const def = DEFAULT_FOCUS_SESSIONS(userIdToLoad)
        setFocusSessions(def)
        setFocusStats(computeFocusStats(def))
      }

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

      let localSS = localStorage.getItem(studyKey)
      if (localSS) {
        setStudyStats(JSON.parse(localSS))
      } else {
        const def = DEFAULT_STUDY_STATS(userIdToLoad)
        localStorage.setItem(studyKey, JSON.stringify(def))
        setStudyStats(def)
      }

      let localAct = localStorage.getItem(activitiesKey)
      if (localAct) {
        setActivities(JSON.parse(localAct))
      } else {
        const def = DEFAULT_ACTIVITIES(userIdToLoad)
        localStorage.setItem(activitiesKey, JSON.stringify(def))
        setActivities(def)
      }

      let localFocus = localStorage.getItem(focusKey)
      if (localFocus) {
        const parsed = JSON.parse(localFocus) as FocusSession[]
        setFocusSessions(parsed)
        setFocusStats(computeFocusStats(parsed))
      } else {
        const def = DEFAULT_FOCUS_SESSIONS(userIdToLoad)
        localStorage.setItem(focusKey, JSON.stringify(def))
        setFocusSessions(def)
        setFocusStats(computeFocusStats(def))
      }
    } finally {
      setLoading(false)
    }
  }, [userIdToLoad, userId, targetUserId, activeUser, supabase])

  useEffect(() => {
    if (userIdToLoad) {
      fetchData()
    }
  }, [userIdToLoad, fetchData])

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

  return {
    loading,
    careerProfile,
    codingStats,
    studyStats,
    activities,
    focusSessions,
    focusStats,
    targetUser,
    updateCareerProfile,
    syncCodingPlatform,
    addActivityLog,
    refetch: fetchData
  }
}
