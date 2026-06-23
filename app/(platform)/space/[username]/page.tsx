'use client'

import React, { use, useState, useEffect, useMemo } from 'react'
import {
  Volume2, VolumeX, Play, Pause, Music, Flame, Quote, Save,
  Settings2, Heart, Coffee, CloudRain, Waves, Trees, ArrowRight,
  Sparkles, Award, User, RefreshCw, BarChart2, ChevronUp, ChevronDown, CheckCircle2,
  Lock, Eye, ImageIcon, Code, Globe, FileText, Compass, Activity, Trophy,
  GraduationCap, Briefcase, BookOpen, Layers, TrendingUp, Clock
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Custom SVG Icons because lucide-react v1.x doesn't export brand icons
const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)
import { UserProfile } from '@/types'
import PageContainer from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/Card'
import { useUserSpace, DEFAULT_USER_SPACE, UserSpaceData } from '@/hooks/useUserSpace'
import { useMoodAndMemories } from '@/hooks/useMoodAndMemories'
import { useDashboardData } from '@/hooks/useDashboardData'

// presets
const WALLPAPERS = [
  { id: 'starry-night', name: 'starry night 🌌', css: '' },
  { id: 'cozy-study', name: 'warm study room 🕯️', css: '' },
  { id: 'rainy-window', name: 'rainy window 🌧️', css: '' },
  { id: 'forest-cabin', name: 'forest cabin 🌲', css: '' },
  { id: 'sunset-vibe', name: 'neon sunset 🌇', css: '' },
]

const THEMES: Record<string, { label: string; glow: string; text: string; bg: string; button: string }> = {
  violet: { label: 'violet dream', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)] border-violet-500/20', text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', button: 'bg-violet-600 hover:bg-violet-500' },
  emerald: { label: 'forest zen', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)] border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', button: 'bg-emerald-600 hover:bg-emerald-500' },
  rose: { label: 'warm rose', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)] border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', button: 'bg-rose-600 hover:bg-rose-500' },
  amber: { label: 'cozy amber', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)] border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', button: 'bg-amber-600 hover:bg-amber-500' },
  sky: { label: 'cloud sky', glow: 'shadow-[0_0_15px_rgba(14,165,233,0.2)] border-sky-500/20', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', button: 'bg-sky-600 hover:bg-sky-500' },
}

interface ProfileIntegration {
  user_id: string
  github_username: string
  linkedin_url: string
  portfolio_url: string
  resume_url: string
  bio: string
  current_mission: string
  current_mission_progress: number
}

interface SpacePageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function SpacePage({ params, searchParams }: SpacePageProps) {
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  const username = decodeURIComponent(resolvedParams.username)

  const supabase = createClient()
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Profile Integration states
  const [integration, setIntegration] = useState<ProfileIntegration | null>(null)
  const [loadingIntegration, setLoadingIntegration] = useState(true)

  // Edit Space modal state
  const [showConfig, setShowConfig] = useState(false)
  const [editingBanner, setEditingBanner] = useState('')
  const [editingStatus, setEditingStatus] = useState('')
  const [editingThemeColor, setEditingThemeColor] = useState('violet')
  const [editingWallpaper, setEditingWallpaper] = useState('starry-night')
  const [editingAccents, setEditingAccents] = useState('none')

  // Integration input states
  const [editingGithub, setEditingGithub] = useState('')
  const [editingLinkedin, setEditingLinkedin] = useState('')
  const [editingPortfolio, setEditingPortfolio] = useState('')
  const [editingResume, setEditingResume] = useState('')
  const [editingBio, setEditingBio] = useState('')
  const [editingMission, setEditingMission] = useState('')
  const [editingProgress, setEditingProgress] = useState(0)

  // Edit Mood state
  const [showMoodLog, setShowMoodLog] = useState(false)
  const [newMood, setNewMood] = useState(7)
  const [newEnergy, setNewEnergy] = useState(6)
  const [newFocus, setNewFocus] = useState(8)
  const [newStatus, setNewStatus] = useState('')

  // GitHub cache API states
  const [githubData, setGithubData] = useState<any>(null)
  const [loadingGithub, setLoadingGithub] = useState(false)
  const [githubError, setGithubError] = useState<string | null>(null)

  // Database activities, projects, achievements states
  const [dbActivities, setDbActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [activeProjects, setActiveProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [recentAchievements, setRecentAchievements] = useState<any[]>([])
  const [loadingAchievements, setLoadingAchievements] = useState(true)

  // Focus sessions for analytics
  const [focusSessions, setFocusSessions] = useState<any[]>([])
  const [loadingFocus, setLoadingFocus] = useState(true)

  // Resolve user profile by username
  useEffect(() => {
    const resolveUsers = async () => {
      setLoadingProfile(true)
      try {
        // 1. Get active session user
        const { data: { user } } = await supabase.auth.getUser()
        let currentProfile: UserProfile | null = null

        if (user) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (prof) {
            currentProfile = prof as UserProfile
            setActiveProfile(currentProfile)
          }
        }

        // 2. Resolve target space username
        const { data: target } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle()

        if (target) {
          setTargetProfile(target as UserProfile)
        } else if (currentProfile && currentProfile.username.toLowerCase() === username.toLowerCase()) {
          setTargetProfile(currentProfile)
        } else {
          console.warn("User space profile not found in DB, using fallback.")
          setTargetProfile({
            id: currentProfile?.id || 'mock-id',
            username: username,
            email: `${username}@system.local`,
            avatar: 'avatar-neon-pulse',
            created_at: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error("Resolve space users failed:", err)
      } finally {
        setLoadingProfile(false)
      }
    }
    resolveUsers()
  }, [username, supabase])

  // Space config hook
  const {
    loading: loadingSpace,
    spaceData,
    isReadOnly,
    updateSpaceData
  } = useUserSpace(targetProfile?.id, activeProfile?.id)

  // Mood logs and timeline statistics hooks
  const {
    moodLogs,
    logMood,
    vaultItems
  } = useMoodAndMemories(targetProfile?.id)

  // Use dashboard hook to render growth stats
  const {
    codingStats
  } = useDashboardData(activeProfile, targetProfile?.id)

  // Fetch profile integrations
  useEffect(() => {
    if (!targetProfile?.id) return
    const fetchIntegration = async () => {
      setLoadingIntegration(true)
      try {
        const { data, error } = await supabase
          .from('profile_integrations')
          .select('*')
          .eq('user_id', targetProfile.id)
          .maybeSingle()

        if (data) {
          setIntegration(data as ProfileIntegration)
          // Seed values for settings panel
          setEditingGithub(data.github_username || '')
          setEditingLinkedin(data.linkedin_url || '')
          setEditingPortfolio(data.portfolio_url || '')
          setEditingResume(data.resume_url || '')
          setEditingBio(data.bio || '')
          setEditingMission(data.current_mission || '')
          setEditingProgress(data.current_mission_progress || 0)
        } else {
          setIntegration({
            user_id: targetProfile.id,
            github_username: '',
            linkedin_url: '',
            portfolio_url: '',
            resume_url: '',
            bio: '',
            current_mission: '',
            current_mission_progress: 0
          })
        }
      } catch (err) {
        console.error("Fetch profile integrations failed:", err)
      } finally {
        setLoadingIntegration(false)
      }
    }
    fetchIntegration()
  }, [targetProfile, supabase])

  // Fetch active projects from Creative Rooms
  const fetchProjects = async () => {
    if (!targetProfile?.id) return
    setLoadingProjects(true)
    try {
      const { data } = await supabase
        .from('projects')
        .select('*, project_contributors(user_id)')
        .eq('created_by', targetProfile.id)
      
      if (data) {
        // Sort in memory by updated_at or created_at descending
        const sorted = [...data].sort((a, b) => {
          const timeA = new Date(a.updated_at || a.created_at).getTime()
          const timeB = new Date(b.updated_at || b.created_at).getTime()
          return timeB - timeA
        })
        setActiveProjects(sorted)
      }
    } catch (err) {
      console.error("Fetch projects failed:", err)
    } finally {
      setLoadingProjects(false)
    }
  }

  // Fetch achievements
  const fetchAchievements = async () => {
    if (!targetProfile?.id) return
    setLoadingAchievements(true)
    try {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', targetProfile.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (data) {
        setRecentAchievements(data)
      }
    } catch (err) {
      console.error("Fetch achievements failed:", err)
    } finally {
      setLoadingAchievements(false)
    }
  }

  // Fetch db activities
  const fetchDbActivities = async () => {
    if (!targetProfile?.id) return
    setLoadingActivities(true)
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', targetProfile.id)
        .order('created_at', { ascending: false })
        .limit(40)
      
      if (data) {
        setDbActivities(data)
      }
    } catch (err) {
      console.error("Fetch db activities failed:", err)
    } finally {
      setLoadingActivities(false)
    }
  }

  const fetchFocusSessions = async () => {
    if (!targetProfile?.id) return
    setLoadingFocus(true)
    try {
      const { data } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', targetProfile.id)
        .eq('completed', true)
        .order('created_at', { ascending: false })
      if (data) {
        setFocusSessions(data)
      }
    } catch (err) {
      console.error("Fetch focus sessions failed:", err)
    } finally {
      setLoadingFocus(false)
    }
  }

  // Initial fetch and subscriptions
  useEffect(() => {
    if (!targetProfile?.id) return

    fetchProjects()
    fetchAchievements()
    fetchDbActivities()
    fetchFocusSessions()

    // 1. Subscribe to activity_logs table for target profile
    const activityChannel = supabase
      .channel(`realtime-activities-${targetProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${targetProfile.id}`
        },
        (payload) => {
          setDbActivities(prev => [payload.new, ...prev].slice(0, 40))
        }
      )
      .subscribe()

    // 2. Subscribe to projects table changes
    const projectsChannel = supabase
      .channel(`realtime-projects-${targetProfile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchProjects()
        }
      )
      .subscribe()

    // 3. Subscribe to achievements changes
    const achievementsChannel = supabase
      .channel(`realtime-achievements-${targetProfile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'achievements', filter: `user_id=eq.${targetProfile.id}` },
        (payload) => {
          setRecentAchievements(prev => [payload.new, ...prev].slice(0, 5))
        }
      )
      .subscribe()

    // 4. Subscribe to focus_sessions changes for target profile
    const focusChannel = supabase
      .channel(`realtime-focus-sessions-space-${targetProfile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${targetProfile.id}` },
        () => {
          fetchFocusSessions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(activityChannel)
      supabase.removeChannel(projectsChannel)
      supabase.removeChannel(achievementsChannel)
      supabase.removeChannel(focusChannel)
    }
  }, [targetProfile?.id, supabase])

  // Fetch GitHub cache details
  useEffect(() => {
    if (!integration?.github_username) {
      setGithubData(null)
      setGithubError(null)
      return
    }

    const fetchGithub = async () => {
      setLoadingGithub(true)
      setGithubError(null)
      try {
        const res = await fetch(`/api/github?username=${encodeURIComponent(integration.github_username)}`)
        const data = await res.json()
        if (res.ok) {
          setGithubData(data)
        } else {
          setGithubError(data.error || 'Failed to load GitHub activity')
        }
      } catch (err) {
        console.error("GitHub fetch failed", err)
        setGithubError('GitHub API currently unavailable')
      } finally {
        setLoadingGithub(false)
      }
    }
    fetchGithub()
  }, [integration?.github_username])

  // Open config modal with current values
  const openConfigModal = () => {
    if (!spaceData) return
    setEditingBanner(spaceData.profile_banner)
    setEditingStatus(spaceData.current_status)
    setEditingThemeColor(spaceData.theme_colors)
    setEditingWallpaper(spaceData.profile_wallpaper)
    setEditingAccents(spaceData.profile_accents)

    if (integration) {
      setEditingGithub(integration.github_username || '')
      setEditingLinkedin(integration.linkedin_url || '')
      setEditingPortfolio(integration.portfolio_url || '')
      setEditingResume(integration.resume_url || '')
      setEditingBio(integration.bio || '')
      setEditingMission(integration.current_mission || '')
      setEditingProgress(integration.current_mission_progress || 0)
    }
    setShowConfig(true)
  }

  // Save config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProfile?.id) return
    setShowConfig(false)

    // Save visual layout details
    await updateSpaceData({
      profile_banner: editingBanner,
      current_status: editingStatus,
      theme_colors: editingThemeColor,
      profile_wallpaper: editingWallpaper,
      profile_accents: editingAccents
    })

    // Save profile integrations
    const updatedData = {
      user_id: activeProfile.id,
      github_username: editingGithub.trim(),
      linkedin_url: editingLinkedin.trim(),
      portfolio_url: editingPortfolio.trim(),
      resume_url: editingResume.trim(),
      bio: editingBio,
      current_mission: editingMission,
      current_mission_progress: Number(editingProgress)
    }

    try {
      const { error } = await supabase
        .from('profile_integrations')
        .upsert(updatedData)
      if (error) throw error
      setIntegration(updatedData as ProfileIntegration)
    } catch (err) {
      console.error("Save profile integrations failed:", err)
    }
  }

  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowMoodLog(false)
    await logMood(newMood, newEnergy, newFocus, newStatus, 'public')
    setNewStatus('')
  }

  // Relative human-readable time formatter helper
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHr / 24)

    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDays === 1) return 'yesterday'
    return `${diffDays} days ago`
  }

  // Combined real-time activities timeline (DB logs + GitHub events)
  const combinedActivities = useMemo(() => {
    const list: any[] = []
    
    // Add DB activities
    dbActivities.forEach(act => {
      list.push({
        id: act.id,
        source: 'app',
        activity_type: act.activity_type,
        description: act.description,
        created_at: act.created_at
      })
    })

    // Add GitHub activities
    if (githubData?.activity?.github_activities) {
      githubData.activity.github_activities.forEach((act: any) => {
        list.push({
          id: act.id,
          source: 'github',
          activity_type: act.activity_type,
          description: act.description,
          created_at: act.created_at
        })
      })
    }

    // Sort by created_at descending and return top 20
    return list
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
  }, [dbActivities, githubData])

  // Mood Trend SVG sparkline generator
  const moodTrendSvg = useMemo(() => {
    const publicLogs = moodLogs.filter(log => log.visibility !== 'private' || !isReadOnly)
    if (publicLogs.length < 2) return null
    const logs = [...publicLogs].reverse().slice(-7) // Show last 7 check-ins
    const width = 340
    const height = 90
    const padding = 15

    const xStep = (width - padding * 2) / (logs.length - 1)
    const points = logs.map((log, index) => {
      const x = padding + index * xStep
      const val = log.mood_value !== undefined ? log.mood_value : (log.mood_rating * 10)
      const y = height - padding - (val / 100) * (height - padding * 2)
      return { x, y, label: log.mood_label || '😐', value: val }
    })

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
    }, '')

    return { points, pathD, width, height }
  }, [moodLogs, isReadOnly])

  if (loadingProfile || loadingSpace || !spaceData) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">visualizing personal room coordinate...</p>
        </div>
      </PageContainer>
    )
  }

  const activeWallpaper = WALLPAPERS.find(w => w.id === spaceData.profile_wallpaper) || WALLPAPERS[0]
  const activeTheme = THEMES[spaceData.theme_colors] || THEMES.violet

  const publicMoodLogs = moodLogs.filter(log => log.visibility !== 'private' || !isReadOnly)
  const latestMood = publicMoodLogs[0]

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-700 p-6 ${activeWallpaper.css}`}>
      
      {/* ── Visual effects overlays ── */}
      {spaceData.profile_accents === 'stars' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-[20%] h-1 w-1 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
          <div className="absolute top-[30%] left-[75%] h-1 w-1 bg-white animate-pulse shadow-[0_0_8px_white]" />
          <div className="absolute top-[60%] left-[10%] h-1.5 w-1.5 rounded-full bg-white animate-pulse shadow-[0_0_12px_white] delay-300" />
          <div className="absolute top-[80%] left-[60%] h-1 w-1 bg-white animate-pulse shadow-[0_0_6px_white] delay-700" />
        </div>
      )}

      {spaceData.profile_accents === 'bubbles' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute bottom-0 left-[10%] h-8 w-8 rounded-full border border-white/20 animate-bounce duration-8000" />
          <div className="absolute bottom-0 left-[40%] h-12 w-12 rounded-full border border-white/20 animate-bounce duration-12000 delay-500" />
          <div className="absolute bottom-0 left-[80%] h-6 w-6 rounded-full border border-white/20 animate-bounce duration-6000 delay-1000" />
        </div>
      )}

      {spaceData.profile_accents === 'neon' && (
        <div className="absolute inset-0 border-2 border-violet-500/20 pointer-events-none rounded-3xl m-2 blur-xs animate-pulse" />
      )}

      <PageContainer>
        {/* Banner Graphic Header */}
        {spaceData.profile_banner && (
          <div className="w-full h-32 md:h-44 rounded-3xl overflow-hidden border border-white/10 mb-6 relative">
            <img src={spaceData.profile_banner} alt="space header banner" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        
        {/* Navigation / space information header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel border-none p-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-full bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center shadow-lg font-bold text-black text-sm`}>
              {targetProfile?.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-gray-900 dark:text-white lowercase">
                  {targetProfile?.username}'s corner
                </h2>
                {spaceData.current_status && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-500 dark:text-gray-400 font-bold">
                    💬 {spaceData.current_status}
                  </span>
                )}
                {latestMood && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold">
                    mood: {latestMood.mood_label}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
                personal digital room • {activeWallpaper.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              href={`/dashboard?userId=${targetProfile?.id}`}
              className="py-2 px-3.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Career Hub</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            
            {!isReadOnly && (
              <button
                onClick={openConfigModal}
                className="py-2 px-3.5 rounded-xl bg-neo-bg shadow-neo border-none text-[11px] font-bold text-[#5E4545] dark:text-[#ffb4b4] hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Room Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Outer widget grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. CURRENT MISSION & BIO */}
            <Card className="p-6 relative overflow-hidden glass-panel border-none">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Compass className="h-4 w-4 text-sky-400" />
                Current Mission
              </h3>
              
              <div className="space-y-4">
                {integration?.bio && (
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold mb-1">about me</span>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {integration.bio}
                    </p>
                  </div>
                )}
                
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold mb-2">objective</span>
                  <div className="neo-inset-panel border-none p-4 rounded-2xl space-y-3">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {integration?.current_mission || 'No active mission configured.'}
                    </p>
                    {integration?.current_mission && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                          <span>mission progress</span>
                          <span className="text-[#5E4545] dark:text-[#ffb4b4]">{integration.current_mission_progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 dark:bg-black/20 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-violet-500 to-rose-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                            style={{ width: `${integration.current_mission_progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. PROFESSIONAL PRESENCE */}
            {integration && (integration.github_username || integration.linkedin_url || integration.portfolio_url || integration.resume_url) && (
              <Card className="p-6 relative overflow-hidden glass-panel border-none">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-400" />
                  Professional Presence
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {integration.github_username && (
                    <a
                      href={`https://github.com/${integration.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-xs font-bold border-none"
                    >
                      <Github className="h-4 w-4 text-gray-900 dark:text-white" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {integration.linkedin_url && (
                    <a
                      href={integration.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-xs font-bold border-none"
                    >
                      <Linkedin className="h-4 w-4 text-sky-500" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {integration.portfolio_url && (
                    <a
                      href={integration.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-xs font-bold border-none"
                    >
                      <Globe className="h-4 w-4 text-emerald-400" />
                      <span>Portfolio</span>
                    </a>
                  )}
                  {integration.resume_url && (
                    <a
                      href={integration.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-xs font-bold border-none"
                    >
                      <FileText className="h-4 w-4 text-rose-400" />
                      <span>Resume</span>
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* 3. DEVELOPER ACTIVITY CARD (GITHUB) */}
            {integration?.github_username && (
              <Card className="p-6 relative overflow-hidden glass-panel border-none">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Github className="h-4 w-4 text-violet-400" />
                  Developer Activity
                </h3>

                {loadingGithub && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
                    <RefreshCw className="h-5 w-5 text-violet-500 animate-spin" />
                    <span className="text-[10px] text-gray-500 font-bold lowercase">fetching activity logs...</span>
                  </div>
                )}

                {githubError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2.5">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>
                      {githubError === 'GitHub user not found' ? 'invalid github username' : 'github api currently unavailable'}
                    </span>
                  </div>
                )}

                {!loadingGithub && !githubError && githubData && (
                  <div className="space-y-6">
                    {/* User info overview banner */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 dark:bg-black/20 p-4 rounded-2xl border border-white/5">
                      <img 
                        src={githubData.profile.avatar_url} 
                        alt="github avatar" 
                        className="h-16 w-16 rounded-2xl border border-white/10 shadow-md"
                      />
                      <div className="text-center sm:text-left flex-1 space-y-1">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white lowercase">
                          {githubData.profile.name}
                        </h4>
                        {githubData.profile.bio && (
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 italic">
                            "{githubData.profile.bio}"
                          </p>
                        )}
                        <div className="flex justify-center sm:justify-start gap-4 text-[10px] text-gray-400 uppercase font-extrabold mt-1">
                          <span>{githubData.profile.followers} followers</span>
                          <span>•</span>
                          <span>{githubData.profile.following} following</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick activity stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="neo-inset-panel border-none p-3.5 rounded-2xl text-center">
                        <span className="text-[9px] text-neo-secondary uppercase block font-bold">Public Repos</span>
                        <span className="text-lg font-black text-[#5E4545] dark:text-[#ffb4b4]">{githubData.profile.public_repos}</span>
                      </div>
                      <div className="neo-inset-panel border-none p-3.5 rounded-2xl text-center">
                        <span className="text-[9px] text-neo-secondary uppercase block font-bold">Total Stars</span>
                        <span className="text-lg font-black text-amber-400">{githubData.activity.total_stars} ⭐</span>
                      </div>
                      <div className="neo-inset-panel border-none p-3.5 rounded-2xl text-center col-span-2">
                        <span className="text-[9px] text-neo-secondary uppercase block font-bold">Top Languages</span>
                        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                          {githubData.activity.top_languages.length > 0 ? (
                            githubData.activity.top_languages.map((lang: string, i: number) => (
                              <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/10 font-bold">
                                {lang}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-gray-500 font-semibold italic">none</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Latest Updated Repo */}
                    {githubData.activity.recent_repos.length > 0 ? (
                      <div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold mb-2">latest updated repository</span>
                        <div className="neo-inset-panel border-none p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-start gap-2 flex-wrap">
                            <a 
                              href={githubData.activity.recent_repos[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-violet-400 hover:underline flex items-center gap-1 lowercase"
                            >
                              <span>{githubData.activity.recent_repos[0].name}</span>
                              <ArrowRight className="h-3 w-3" />
                            </a>
                            <span className="text-[9px] font-extrabold text-amber-400 flex items-center gap-0.5">
                              ⭐ {githubData.activity.recent_repos[0].stars}
                            </span>
                          </div>
                          {githubData.activity.recent_repos[0].description && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
                              {githubData.activity.recent_repos[0].description}
                            </p>
                          )}
                          <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-extrabold pt-1">
                            <span>Language: {githubData.activity.recent_repos[0].language || 'Unknown'}</span>
                            <span>pushed {new Date(githubData.activity.recent_repos[0].pushed_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
                        no repositories found.
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* FOCUS ANALYTICS */}
            <FocusAnalyticsCard 
              sessions={focusSessions} 
              loading={loadingFocus} 
              themeAccent={spaceData.theme_colors} 
            />

            {/* FOCUS INSIGHTS */}
            <FocusInsightsCard 
              sessions={focusSessions} 
              loading={loadingFocus} 
              themeAccent={spaceData.theme_colors} 
            />

            {/* 4. EMOTIONAL STATUS & MOOD TRENDS */}
            <Card className="p-6 relative overflow-hidden glass-panel border-none">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" />
                emotional status & mood trends
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold">latest checkin</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xl">{latestMood?.mood_label?.split(' ')[0] || '😐'}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        "{latestMood?.status_text || 'stable state.'}"
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="neo-inset-panel border-none p-3 rounded-2xl flex-1 text-center">
                      <span className="text-[9px] text-neo-secondary uppercase block font-bold">mood</span>
                      <span className="text-lg font-black text-rose-400">
                        {latestMood ? (latestMood.mood_value !== undefined ? latestMood.mood_value : latestMood.mood_rating * 10) : 50}/100
                      </span>
                    </div>
                    <div className="neo-inset-panel border-none p-3 rounded-2xl flex-1 text-center">
                      <span className="text-[9px] text-neo-secondary uppercase block font-bold">energy</span>
                      <span className="text-lg font-black text-amber-400">{latestMood?.energy_level || 5}/10</span>
                    </div>
                    <div className="neo-inset-panel border-none p-3 rounded-2xl flex-1 text-center">
                      <span className="text-[9px] text-neo-secondary uppercase block font-bold">focus</span>
                      <span className="text-lg font-black text-[#5E4545] dark:text-[#ffb4b4]">{latestMood?.focus_level || 5}/10</span>
                    </div>
                  </div>

                  {!isReadOnly ? (
                    <button
                      onClick={() => setShowMoodLog(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-white/5 bg-white/5 text-xs font-bold text-gray-900 dark:text-white hover:bg-white/10 transition-all cursor-pointer text-center"
                    >
                      Log New Mood Check-in
                    </button>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold bg-white/3 p-3 rounded-2xl border border-white/5 flex items-center gap-1.5 justify-center">
                      <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                      <span>sharing their coding journey with friends.</span>
                    </div>
                  )}
                </div>

                {/* Mood trend graph visualizer */}
                <div className="flex flex-col justify-center items-center">
                  <span className="text-[9px] text-gray-500 block uppercase font-bold mb-2 tracking-wider">Mood index chart</span>
                  {moodTrendSvg ? (
                    <div className="relative">
                      <svg width={moodTrendSvg.width} height={moodTrendSvg.height} className="overflow-visible">
                        <defs>
                          <linearGradient id="moodGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area block */}
                        <path 
                          d={`${moodTrendSvg.pathD} L ${moodTrendSvg.points[moodTrendSvg.points.length - 1].x} ${moodTrendSvg.height - 15} L ${moodTrendSvg.points[0].x} ${moodTrendSvg.height - 15} Z`} 
                          fill="url(#moodGlow)" 
                        />
                        {/* Sparkline path */}
                        <path 
                          d={moodTrendSvg.pathD} 
                          fill="none" 
                          stroke="#f43f5e" 
                          strokeWidth="2.5" 
                          className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                        />
                        {/* Grid reference lines */}
                        <line x1="15" y1="15" x2="325" y2="15" stroke="white" strokeOpacity="0.05" strokeDasharray="3" />
                        <line x1="15" y1="75" x2="325" y2="75" stroke="white" strokeOpacity="0.05" strokeDasharray="3" />
                        
                        {/* Nodes */}
                        {moodTrendSvg.points.map((p, idx) => (
                          <g key={idx} className="group/node">
                            <circle cx={p.x} cy={p.y} r="4" fill="#141520" stroke="#f43f5e" strokeWidth="2" />
                            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" className="opacity-70 fill-white select-none pointer-events-none">
                              {p.label.split(' ')[0]}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-500 font-semibold border border-dashed border-white/5 rounded-2xl w-full">
                      need at least 2 logs to trace trend.
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* 5. ACTIVE PROJECTS (CREATIVE ROOMS) */}
            <Card className="p-6 relative overflow-hidden glass-panel border-none">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Code className="h-4 w-4 text-emerald-400" />
                Active Projects
              </h3>

              {loadingProjects ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
                  <RefreshCw className="h-4 w-4 text-emerald-500 animate-spin" />
                  <span className="text-[10px] text-gray-500 font-bold lowercase">fetching project nodes...</span>
                </div>
              ) : activeProjects.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 font-semibold border border-dashed border-white/5 rounded-2xl">
                  no active projects hosted on this node.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProjects.map(proj => (
                    <div key={proj.id} className="neo-inset-panel border-none p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white lowercase">
                            {proj.name}
                          </h4>
                          {proj.description && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mt-0.5">
                              {proj.description}
                            </p>
                          )}
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-bold uppercase">
                          {proj.progress}% done
                        </span>
                      </div>

                      {/* Glassmorphic progress bar */}
                      <div className="w-full bg-white/10 dark:bg-black/20 h-2 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-extrabold pt-1">
                        <span>{proj.project_contributors?.length || 0} contributors</span>
                        <span>updated {formatRelativeTime(proj.updated_at || proj.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 6. RECENT ACTIVITY FEED */}
            <Card className="p-6 relative overflow-hidden glass-panel border-none">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-400" />
                Recent Activity
              </h3>

              {loadingActivities ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
                  <RefreshCw className="h-4 w-4 text-rose-500 animate-spin" />
                  <span className="text-[10px] text-gray-500 font-bold lowercase">compiling activity feed...</span>
                </div>
              ) : combinedActivities.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 font-semibold border border-dashed border-white/5 rounded-2xl">
                  no activity logs on this node.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin pr-1 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-black/5 dark:before:bg-white/5 pt-1">
                  {combinedActivities.map((act) => {
                    // Decide activity indicator colors and icon
                    let borderGlowColor = 'border-violet-500/20 text-violet-400'
                    let prefix = '•'
                    
                    if (act.source === 'github') {
                      borderGlowColor = 'border-emerald-500/20 text-emerald-400'
                      prefix = '🐙'
                    } else {
                      if (act.activity_type.includes('project')) {
                        borderGlowColor = 'border-sky-500/20 text-sky-400'
                        prefix = '🚀'
                      } else if (act.activity_type.includes('focus') || act.activity_type.includes('study')) {
                        borderGlowColor = 'border-purple-500/20 text-purple-400'
                        prefix = '🕯️'
                      } else if (act.activity_type.includes('vault')) {
                        borderGlowColor = 'border-rose-500/20 text-rose-400'
                        prefix = '📦'
                      } else if (act.activity_type.includes('achievement')) {
                        borderGlowColor = 'border-amber-500/20 text-amber-400'
                        prefix = '🏆'
                      }
                    }

                    return (
                      <div key={act.id} className="flex gap-4 relative animate-fadeIn">
                        <div className={`h-6.5 w-6.5 rounded-full border ${borderGlowColor} flex items-center justify-center shrink-0 z-10 bg-[#fefdfb] dark:bg-[#1a142a] text-xs font-bold shadow-sm`}>
                          {prefix}
                        </div>
                        <div className="space-y-0.5 mt-0.5 flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 lowercase leading-snug">
                            {act.description}
                          </p>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-bold">
                            {formatRelativeTime(act.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            
            {/* Presence user detail card */}
            <Card className="p-6 glass-panel border-none text-center flex flex-col items-center">
              <div className="relative mb-3.5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-rose-500/20 blur-md opacity-70" />
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center text-xl font-black text-black border border-white/10 relative z-10 shadow-lg`}>
                  {targetProfile?.username.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white lowercase">@{targetProfile?.username}</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-black">
                {isReadOnly ? 'linking coordinate' : 'your digital home corner'}
              </p>

              <div className="w-full mt-4 pt-4 border-t border-white/5 text-left text-xs font-semibold space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Class:</span>
                  <span className="text-violet-400">{activeTheme.label}</span>
                </div>
                {latestMood && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Mood Vibe:</span>
                    <span className="text-rose-400">{latestMood.mood_label}</span>
                  </div>
                )}
                {integration?.github_username && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">GitHub Node:</span>
                    <span className="text-emerald-400">connected</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Visuals:</span>
                  <span className="text-sky-400">{spaceData.profile_accents}</span>
                </div>
              </div>
            </Card>

            {/* Pinned moments scrapbook preview */}
            <Card className="p-6 glass-panel border-none space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-400" />
                recent vault entries
              </h3>

              <div className="space-y-3">
                {vaultItems && vaultItems.length > 0 ? (
                  vaultItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="neo-inset-panel border-none p-3 rounded-2xl text-xs space-y-1">
                      <span className="text-[9px] text-neo-secondary font-bold block">
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <p className="font-bold text-gray-900 dark:text-white lowercase">{item.title}</p>
                      {item.notes && <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">"{item.notes}"</p>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    no moments pinned.
                  </div>
                )}
              </div>
              
              <Link 
                href="/us/vault" 
                className="block text-center py-2 border border-white/5 rounded-xl text-xs text-violet-400 font-bold hover:bg-white/3 transition-all"
              >
                Open Scrapbook Vault
              </Link>
            </Card>

            {/* RECENT ACHIEVEMENTS */}
            <Card className="p-6 glass-panel border-none space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                Recent Achievements
              </h3>

              {loadingAchievements ? (
                <div className="flex flex-col items-center justify-center py-6 gap-1 animate-pulse">
                  <RefreshCw className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                  <span className="text-[9px] text-gray-500 font-bold lowercase">fetching achievements...</span>
                </div>
              ) : recentAchievements.length === 0 ? (
                <div className="text-center py-4 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  no achievements unlocked.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAchievements.map((ach) => (
                    <div key={ach.id} className="neo-inset-panel border-none p-3 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between items-baseline gap-1">
                        <span className="text-[9px] text-neo-secondary font-bold uppercase tracking-wider block">
                          {ach.verb}
                        </span>
                        <span className="text-[9.5px] font-bold text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(ach.created_at)}
                        </span>
                      </div>
                      <p className="font-extrabold text-gray-900 dark:text-white lowercase flex items-center gap-1">
                        🏆 {ach.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

        </div>

        {/* Modal: Customize Room Settings */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfig(false)} />
            
            <div className="relative w-full max-w-lg glass-panel border-none rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold max-h-[90vh] overflow-y-auto">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 pb-3 flex items-center justify-between">
                <span>Configure Profile & Identity</span>
                <button type="button" onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">✕</button>
              </h3>

              <form onSubmit={handleSaveConfig} className="space-y-4 mt-4 text-gray-700 dark:text-gray-300">
                
                {/* 1. APPEARANCE SETTINGS */}
                <span className="text-[9px] uppercase tracking-widest text-violet-400 font-extrabold block border-b border-white/5 pb-1">Appearance Settings</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Theme Accent Color</label>
                    <select
                      value={editingThemeColor}
                      onChange={(e) => setEditingThemeColor(e.target.value)}
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none"
                    >
                      {Object.keys(THEMES).map(k => (
                        <option key={k} value={k} className="bg-white dark:bg-[#141520]">{THEMES[k].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Preset Wallpaper</label>
                    <select
                      value={editingWallpaper}
                      onChange={(e) => setEditingWallpaper(e.target.value)}
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none"
                    >
                      {WALLPAPERS.map(w => (
                        <option key={w.id} value={w.id} className="bg-white dark:bg-[#141520]">{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Profile Accents (Visual Effects)</label>
                    <select
                      value={editingAccents}
                      onChange={(e) => setEditingAccents(e.target.value)}
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none"
                    >
                      <option value="none" className="bg-white dark:bg-[#141520]">None</option>
                      <option value="stars" className="bg-white dark:bg-[#141520]">Star Sparkles 🌌</option>
                      <option value="bubbles" className="bg-white dark:bg-[#141520]">Floating Bubbles 🫧</option>
                      <option value="neon" className="bg-white dark:bg-[#141520]">Neon Pulsing Border ⚡</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Current status text</label>
                    <input
                      type="text"
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value)}
                      placeholder="e.g. coding 3am..."
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 dark:text-gray-400 block mb-1">Profile Banner Image URL (Optional)</label>
                  <input
                    type="url"
                    value={editingBanner}
                    onChange={(e) => setEditingBanner(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                {/* 2. IDENTITY & SOCIAL LINKS */}
                <span className="text-[9px] uppercase tracking-widest text-violet-400 font-extrabold block border-b border-white/5 pt-2 pb-1">Professional Identity</span>
                
                <div>
                  <label className="text-gray-500 dark:text-gray-400 block mb-1">Bio Description</label>
                  <textarea
                    value={editingBio}
                    onChange={(e) => setEditingBio(e.target.value)}
                    placeholder="Tell visitors about yourself, your interests, and what you study..."
                    className="w-full h-20 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">GitHub Username</label>
                    <input
                      type="text"
                      value={editingGithub}
                      onChange={(e) => setEditingGithub(e.target.value)}
                      placeholder="e.g. sravankumar006"
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={editingLinkedin}
                      onChange={(e) => setEditingLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Portfolio URL</label>
                    <input
                      type="url"
                      value={editingPortfolio}
                      onChange={(e) => setEditingPortfolio(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Resume URL</label>
                    <input
                      type="url"
                      value={editingResume}
                      onChange={(e) => setEditingResume(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                {/* 3. CURRENT MISSION SETTINGS */}
                <span className="text-[9px] uppercase tracking-widest text-violet-400 font-extrabold block border-b border-white/5 pt-2 pb-1">Current Mission Tracker</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Mission Objective</label>
                    <input
                      type="text"
                      value={editingMission}
                      onChange={(e) => setEditingMission(e.target.value)}
                      placeholder="e.g. Build collaborative design systems..."
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Progress: {editingProgress}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingProgress}
                      onChange={(e) => setEditingProgress(Number(e.target.value))}
                      className="w-full accent-violet-500 h-2 bg-white/10 rounded-full cursor-pointer mt-3"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="px-4 py-2 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-gray-900 dark:text-white border-transparent rounded-xl shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Log Mood check-in */}
        {showMoodLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowMoodLog(false)} />
            
            <div className="relative w-full max-w-lg bg-white dark:bg-[#141520] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold text-gray-700 dark:text-gray-300">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-white/5 pb-3">
                how are you feeling? check in with the node.
              </h3>

              <form onSubmit={handleSaveMood} className="space-y-5 mt-5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <label className="text-gray-500 dark:text-gray-400">Mood Index: {newMood * 10}/100</label>
                    <span className="text-rose-400 font-semibold">
                      {newMood <= 3 ? '😔 Low' : newMood <= 5 ? '😕 Tired' : newMood <= 7 ? '😐 Okay' : newMood <= 9 ? '🙂 Good' : '😀 Great'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newMood}
                    onChange={(e) => setNewMood(parseInt(e.target.value))}
                    className="w-full accent-rose-500 h-1.5 rounded-full cursor-pointer bg-white/10"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <label className="text-gray-500 dark:text-gray-400">Energy Level: {newEnergy}/10</label>
                    <span className="text-amber-400 font-semibold">{newEnergy <= 4 ? 'Tired / Drained' : newEnergy <= 7 ? 'Balanced' : 'Energized'}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newEnergy}
                    onChange={(e) => setNewEnergy(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 rounded-full cursor-pointer bg-white/10"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <label className="text-gray-500 dark:text-gray-400">Focus Index: {newFocus}/10</label>
                    <span className="text-violet-400 font-semibold">{newFocus <= 4 ? 'Distracted' : newFocus <= 7 ? 'Studying / Flow' : 'Absolute Deep Focus'}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newFocus}
                    onChange={(e) => setNewFocus(parseInt(e.target.value))}
                    className="w-full accent-violet-500 h-1.5 rounded-full cursor-pointer bg-white/10"
                  />
                </div>

                <div>
                  <label className="text-gray-500 dark:text-gray-400 block mb-1.5">What is on your mind? (Status description)</label>
                  <input
                    type="text"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    placeholder="e.g. debugging Next.js middlewares until midnight..."
                    className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50 font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowMoodLog(false)}
                    className="px-4 py-2 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-gray-900 dark:text-white border-transparent rounded-xl shadow-md cursor-pointer"
                  >
                    Record Log checkin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </div>
  )
}

// ========================================================
// FOCUS ANALYTICS SUB-COMPONENTS & HELPERS
// ========================================================

const getThemeColors = (theme: string) => {
  switch (theme) {
    case 'emerald':
      return {
        primary: 'text-emerald-400',
        bg: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-teal-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-emerald-500/20', 'bg-emerald-500/40', 'bg-emerald-500/60', 'bg-emerald-500']
      }
    case 'rose':
      return {
        primary: 'text-rose-400',
        bg: 'bg-rose-500',
        gradient: 'from-rose-500 to-pink-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-rose-500/20', 'bg-rose-500/40', 'bg-rose-500/60', 'bg-rose-500']
      }
    case 'amber':
      return {
        primary: 'text-amber-400',
        bg: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-amber-500/20', 'bg-amber-500/40', 'bg-amber-500/60', 'bg-amber-500']
      }
    case 'sky':
      return {
        primary: 'text-sky-400',
        bg: 'bg-sky-500',
        gradient: 'from-sky-500 to-blue-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-sky-500/20', 'bg-sky-500/40', 'bg-sky-500/60', 'bg-sky-500']
      }
    case 'violet':
    default:
      return {
        primary: 'text-violet-400',
        bg: 'bg-violet-600 dark:bg-violet-500',
        gradient: 'from-violet-500 to-indigo-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-violet-500/20', 'bg-violet-500/40', 'bg-violet-500/60', 'bg-violet-500']
      }
  }
}

// Define categories mapping for distribution display
const ANALYTICS_CATEGORIES = [
  { id: 'Academics', label: 'Academics', icon: GraduationCap },
  { id: 'Coding', label: 'Coding', icon: Code },
  { id: 'Project', label: 'Projects', icon: Briefcase },
  { id: 'Reading', label: 'Reading', icon: BookOpen },
  { id: 'Other', label: 'Other', icon: Layers }
]

interface FocusAnalyticsCardProps {
  sessions: any[]
  loading: boolean
  themeAccent: string
}

function FocusAnalyticsCard({ sessions, loading, themeAccent }: FocusAnalyticsCardProps) {
  const colors = getThemeColors(themeAccent)
  
  // Computations
  const completedSessions = useMemo(() => sessions.filter(s => s.completed), [sessions])
  
  // 1. TODAY STATS
  const todayStats = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayMs = todayStart.getTime()
    
    const todaySessions = completedSessions.filter(s => new Date(s.created_at).getTime() >= todayMs)
    const totalMinutes = todaySessions.reduce((acc, s) => acc + (s.actual_minutes || s.duration_minutes || 0), 0)
    const count = todaySessions.length
    const longest = count > 0 ? Math.max(...todaySessions.map(s => s.actual_minutes || s.duration_minutes || 0)) : 0
    
    return { totalMinutes, count, longest }
  }, [completedSessions])
  
  // 2. THIS WEEK STATS
  const weekStats = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const weekSessions = completedSessions.filter(s => new Date(s.created_at).getTime() >= oneWeekAgo)
    const totalMinutes = weekSessions.reduce((acc, s) => acc + (s.actual_minutes || s.duration_minutes || 0), 0)
    const count = weekSessions.length
    const avg = count > 0 ? Math.round(totalMinutes / count) : 0
    
    return { 
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      avg
    }
  }, [completedSessions])
  
  // 3. STREAK
  const streak = useMemo(() => {
    if (completedSessions.length === 0) return 0
    
    const uniqueDates = Array.from(new Set(
      completedSessions.map(s => new Date(s.created_at).toDateString())
    )).map(d => new Date(d))
    
    uniqueDates.sort((a, b) => b.getTime() - a.getTime())
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const mostRecent = uniqueDates[0]
    mostRecent.setHours(0, 0, 0, 0)
    
    if (mostRecent.getTime() !== today.getTime() && mostRecent.getTime() !== yesterday.getTime()) {
      return 0
    }
    
    let currentStreak = 1
    let current = mostRecent
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const next = uniqueDates[i]
      next.setHours(0, 0, 0, 0)
      
      const diffTime = current.getTime() - next.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        currentStreak++
        current = next
      } else if (diffDays > 1) {
        break
      }
    }
    return currentStreak
  }, [completedSessions])

  // 4. CATEGORY BREAKDOWN
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {
      Academics: 0,
      Coding: 0,
      Projects: 0,
      Reading: 0,
      Other: 0
    }
    
    completedSessions.forEach(s => {
      let cat = s.category || 'Other'
      if (cat === 'Project') cat = 'Projects'
      if (counts[cat] !== undefined) {
        counts[cat]++
      } else {
        counts.Other++
      }
    })
    
    const total = completedSessions.length
    return Object.keys(counts).map(key => ({
      name: key,
      count: counts[key],
      percentage: total > 0 ? Math.round((counts[key] / total) * 100) : 0
    })).sort((a, b) => b.count - a.count)
  }, [completedSessions])

  // 5. 90-DAY HEATMAP CELLS
  const heatmapData = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const cells = []
    const minutesByDateStr: Record<string, number> = {}
    
    completedSessions.forEach(s => {
      const dateStr = new Date(s.created_at).toDateString()
      minutesByDateStr[dateStr] = (minutesByDateStr[dateStr] || 0) + (s.actual_minutes || s.duration_minutes || 0)
    })
    
    for (let i = 89; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      const dateStr = d.toDateString()
      const mins = minutesByDateStr[dateStr] || 0
      
      let level = 0
      if (mins > 0 && mins < 25) level = 1
      else if (mins >= 25 && mins < 50) level = 2
      else if (mins >= 50 && mins < 90) level = 3
      else if (mins >= 90) level = 4
      
      cells.push({ date: d, mins, level })
    }
    
    return cells
  }, [completedSessions])

  // 6. WEEKLY CHART DATA
  const weeklyChartData = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const minutesByDateStr: Record<string, number> = {}
    completedSessions.forEach(s => {
      const dateStr = new Date(s.created_at).toDateString()
      minutesByDateStr[dateStr] = (minutesByDateStr[dateStr] || 0) + (s.actual_minutes || s.duration_minutes || 0)
    })
    
    const list = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      const dateStr = d.toDateString()
      const mins = minutesByDateStr[dateStr] || 0
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      list.push({ dayLabel, mins })
    }
    
    const maxMins = Math.max(...list.map(item => item.mins), 60)
    return { list, maxMins }
  }, [completedSessions])

  // 7. MONTHLY CHART DATA (4 WEEKS)
  const monthlyChartData = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayMs = todayStart.getTime()
    
    const weekMins = [0, 0, 0, 0]
    
    completedSessions.forEach(s => {
      const sTime = new Date(s.created_at).getTime()
      const diffDays = Math.floor((todayMs - sTime) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 0 && diffDays < 7) {
        weekMins[0] += (s.actual_minutes || s.duration_minutes || 0)
      } else if (diffDays >= 7 && diffDays < 14) {
        weekMins[1] += (s.actual_minutes || s.duration_minutes || 0)
      } else if (diffDays >= 14 && diffDays < 21) {
        weekMins[2] += (s.actual_minutes || s.duration_minutes || 0)
      } else if (diffDays >= 21 && diffDays < 28) {
        weekMins[3] += (s.actual_minutes || s.duration_minutes || 0)
      }
    })
    
    const list = [
      { label: '3 wks ago', hours: Number((weekMins[3] / 60).toFixed(1)) },
      { label: '2 wks ago', hours: Number((weekMins[2] / 60).toFixed(1)) },
      { label: 'last wk', hours: Number((weekMins[1] / 60).toFixed(1)) },
      { label: 'this wk', hours: Number((weekMins[0] / 60).toFixed(1)) }
    ]
    
    const maxHours = Math.max(...list.map(item => item.hours), 10)
    return { list, maxHours }
  }, [completedSessions])

  if (loading) {
    return (
      <Card className="p-6 glass-panel border-none">
        <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 text-violet-500 animate-spin" />
          <span className="text-[10px] text-gray-500 font-bold lowercase">compiling focus analytics...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none space-y-6">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-violet-400" />
        Focus Analytics
      </h3>

      {/* Grid: Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl space-y-2">
          <span className="text-[9px] text-neo-secondary uppercase block font-bold">today</span>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">focus time:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{todayStats.totalMinutes}m</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">sessions:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{todayStats.count}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">longest:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{todayStats.longest}m</span>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl space-y-2">
          <span className="text-[9px] text-neo-secondary uppercase block font-bold">this week</span>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">total hours:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{weekStats.totalHours}h</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">avg duration:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{weekStats.avg}m</span>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex flex-col justify-center items-center text-center">
          <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-1">
            <Flame className="h-4.5 w-4.5 fill-rose-500 animate-bounce" />
          </div>
          <span className="text-[9px] text-neo-secondary uppercase block font-bold">focus streak</span>
          <span className="text-xl font-black text-rose-400">{streak} {streak === 1 ? 'day' : 'days'}</span>
        </div>
      </div>

      {/* Grid: Charts & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Category Breakdown */}
        <div className="space-y-4">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">category distribution</span>
          <div className="space-y-3">
            {categoryStats.map((item) => {
              const catConfig = ANALYTICS_CATEGORIES.find(c => c.id === item.name) || ANALYTICS_CATEGORIES[4]
              const CatIcon = catConfig.icon
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                    <div className="flex items-center gap-1.5">
                      <CatIcon className="h-3.5 w-3.5 text-gray-500" />
                      <span>{catConfig.label}</span>
                    </div>
                    <span>{item.percentage}% ({item.count})</span>
                  </div>
                  <div className="w-full bg-white/5 dark:bg-black/20 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${colors.bg}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Charts: Trends */}
        <div className="space-y-4">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">focus trends</span>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Weekly trend bar chart */}
            <div className="neo-inset-panel border-none p-3.5 rounded-2xl flex flex-col justify-between min-h-[170px]">
              <span className="text-[8.5px] text-neo-secondary uppercase block font-bold text-center mb-2">weekly trend (mins)</span>
              <div className="flex items-end justify-between h-24 px-1">
                {weeklyChartData.list.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group/bar relative">
                    <div className="absolute bottom-full mb-1 bg-black/90 text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold z-10">
                      {item.mins}m
                    </div>
                    <div 
                      className={`w-2.5 rounded-t-sm bg-gradient-to-t ${colors.gradient} transition-all duration-500`}
                      style={{ height: `${Math.max(4, (item.mins / weeklyChartData.maxMins) * 100)}%` }}
                    />
                    <span className="text-[8px] text-gray-500 font-bold mt-1.5 scale-90">{item.dayLabel.slice(0, 1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly trend bar chart */}
            <div className="neo-inset-panel border-none p-3.5 rounded-2xl flex flex-col justify-between min-h-[170px]">
              <span className="text-[8.5px] text-neo-secondary uppercase block font-bold text-center mb-2">monthly trend (hours)</span>
              <div className="flex items-end justify-between h-24 px-1">
                {monthlyChartData.list.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group/bar relative">
                    <div className="absolute bottom-full mb-1 bg-black/90 text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold z-10">
                      {item.hours}h
                    </div>
                    <div 
                      className={`w-3.5 rounded-t-sm bg-gradient-to-t ${colors.gradient} transition-all duration-500`}
                      style={{ height: `${Math.max(4, (item.hours / monthlyChartData.maxHours) * 100)}%` }}
                    />
                    <span className="text-[8px] text-gray-500 font-bold mt-1.5 scale-90 truncate max-w-[32px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub-style Heatmap */}
      <div className="space-y-3 pt-2">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">focus activity (last 90 days)</span>
        <div className="neo-inset-panel border-none p-4 rounded-2xl">
          <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5 md:gap-2">
            {heatmapData.map((cell, idx) => {
              const bgClass = cell.level === 0 ? colors.levels[0] : colors.levels[cell.level]
              return (
                <div 
                  key={idx} 
                  className={`aspect-square w-full rounded-md transition-all duration-300 relative group/cell border border-transparent hover:scale-110 cursor-pointer ${bgClass}`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-40 bg-black/90 text-[8.5px] text-white px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover/cell:opacity-100 transition-opacity whitespace-nowrap font-bold shadow-lg">
                    {cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {cell.mins} mins
                  </div>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex justify-end items-center gap-1.5 mt-3 text-[8.5px] text-gray-500 font-bold uppercase tracking-wider">
            <span>Less</span>
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[0]}`} />
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[1]}`} />
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[2]}`} />
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[3]}`} />
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[4]}`} />
            <span>More</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function FocusInsightsCard({ sessions, loading, themeAccent }: FocusAnalyticsCardProps) {
  const colors = getThemeColors(themeAccent)
  const completedSessions = useMemo(() => sessions.filter(s => s.completed), [sessions])

  // Computations
  const insights = useMemo(() => {
    if (completedSessions.length === 0) {
      return {
        bestWindow: "Establish more focus sessions to discover your peak focus window.",
        bestDay: "Begin studying to determine your most productive day of the week.",
        avgDuration: 0,
        longestSession: 0,
        mostUsedCategory: "None",
        comparisonInsight: "No focus data available yet. Start your first session under Growth!",
        monthlyImprovement: "Monthly trends will appear after logging focus sessions."
      }
    }

    // 1. Avg duration & Longest session
    const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.actual_minutes || s.duration_minutes || 0), 0)
    const avgDuration = Math.round(totalMinutes / completedSessions.length)
    const longestSession = Math.max(...completedSessions.map(s => s.actual_minutes || s.duration_minutes || 0))

    // 2. Best Focus Window (Peak Hour of Day)
    const hours = Array(24).fill(0)
    completedSessions.forEach(s => {
      const date = new Date(s.started_at || s.created_at)
      const hour = date.getHours()
      hours[hour] += (s.actual_minutes || s.duration_minutes || 0)
    })
    const peakHour = hours.indexOf(Math.max(...hours))
    const formatHour = (h: number) => {
      const period = h >= 12 ? 'PM' : 'AM'
      const displayH = h % 12 === 0 ? 12 : h % 12
      return `${displayH} ${period}`
    }
    const bestWindow = `Your best focus window is ${formatHour(peakHour)} - ${formatHour((peakHour + 3) % 24)}.`

    // 3. Best Focus Day (Most productive day of week)
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const days = Array(7).fill(0)
    completedSessions.forEach(s => {
      const date = new Date(s.created_at)
      const day = date.getDay()
      days[day] += (s.actual_minutes || s.duration_minutes || 0)
    })
    const peakDayIndex = days.indexOf(Math.max(...days))
    const bestDay = `${daysOfWeek[peakDayIndex]} is your most productive day.`

    // 4. Most used category & Category comparisons
    const categoryCounts: Record<string, number> = {}
    const categoryMinutes: Record<string, number> = {}
    completedSessions.forEach(s => {
      const cat = s.category || 'Other'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      categoryMinutes[cat] = (categoryMinutes[cat] || 0) + (s.actual_minutes || s.duration_minutes || 0)
    })
    
    let mostUsedCategory = "Other"
    let maxCount = -1
    Object.keys(categoryCounts).forEach(cat => {
      if (categoryCounts[cat] > maxCount) {
        maxCount = categoryCounts[cat]
        mostUsedCategory = cat
      }
    })

    // Category comparison sentence
    let comparisonInsight = `Coding is your primary focus category.`
    const sortedCats = Object.keys(categoryMinutes).map(cat => ({
      name: cat,
      mins: categoryMinutes[cat]
    })).sort((a, b) => b.mins - a.mins)

    if (sortedCats.length >= 2) {
      const topCat = sortedCats[0]
      const secondCat = sortedCats[1]
      const diffPct = Math.round(((topCat.mins - secondCat.mins) / secondCat.mins) * 100)
      
      const formatCatLabel = (name: string) => {
        if (name === 'Project') return 'projects'
        return name.toLowerCase()
      }

      if (diffPct > 0) {
        comparisonInsight = `You focus ${diffPct}% longer on ${formatCatLabel(topCat.name)} tasks than ${formatCatLabel(secondCat.name)} tasks.`
      } else {
        comparisonInsight = `You focus most frequently on ${formatCatLabel(topCat.name)} tasks.`
      }
    } else if (sortedCats.length === 1) {
      comparisonInsight = `${sortedCats[0].name} tasks comprise 100% of your focus history.`
    }

    // 5. Monthly improvement percentage (last 30 days vs 30 days before that)
    const todayMs = new Date().setHours(0, 0, 0, 0)
    let curr30Mins = 0
    let prev30Mins = 0
    
    completedSessions.forEach(s => {
      const sTime = new Date(s.created_at).getTime()
      const diffDays = Math.floor((todayMs - sTime) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 0 && diffDays < 30) {
        curr30Mins += (s.actual_minutes || s.duration_minutes || 0)
      } else if (diffDays >= 30 && diffDays < 60) {
        prev30Mins += (s.actual_minutes || s.duration_minutes || 0)
      }
    })

    let monthlyImprovement = "Consistency is key. Focus this week to lock in your next milestone!"
    if (prev30Mins === 0) {
      if (curr30Mins > 0) {
        monthlyImprovement = "You increased your focus time by 100% this month compared to last month!"
      }
    } else {
      const diff = Math.round(((curr30Mins - prev30Mins) / prev30Mins) * 100)
      if (diff > 0) {
        monthlyImprovement = `You increased your monthly focus time by ${diff}% compared to the previous month.`
      } else if (diff < 0) {
        monthlyImprovement = `Your monthly focus time is ${Math.abs(diff)}% lower than the previous month. Let's find your rhythm again!`
      } else {
        monthlyImprovement = `You focused the exact same amount this month as the previous month. Consistency is key!`
      }
    }

    return {
      bestWindow,
      bestDay,
      avgDuration,
      longestSession,
      mostUsedCategory,
      comparisonInsight,
      monthlyImprovement
    }
  }, [completedSessions])

  if (loading) {
    return (
      <Card className="p-6 glass-panel border-none">
        <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 text-violet-500 animate-spin" />
          <span className="text-[10px] text-gray-500 font-bold lowercase">generating focus insights...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none space-y-5">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        Focus Insights
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peak Focus Window */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-neo-secondary uppercase block font-bold">peak window</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white lowercase leading-snug">{insights.bestWindow}</p>
          </div>
        </div>

        {/* Most Productive Day */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="h-5 w-5 fill-amber-500/10" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-neo-secondary uppercase block font-bold">peak day</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white lowercase leading-snug">{insights.bestDay}</p>
          </div>
        </div>

        {/* Comparative Area analysis */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Code className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-neo-secondary uppercase block font-bold">category comparison</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white lowercase leading-snug">{insights.comparisonInsight}</p>
          </div>
        </div>

        {/* Monthly growth/improvement */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-neo-secondary uppercase block font-bold">monthly progress</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white lowercase leading-snug">{insights.monthlyImprovement}</p>
          </div>
        </div>
      </div>

      {/* Focus averages and records summary bar */}
      <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
        <div className="text-center">
          <span className="text-[8px] text-neo-muted font-extrabold uppercase tracking-widest block mb-0.5 font-sans">avg session</span>
          <span className="text-sm font-black text-gray-950 dark:text-white">{insights.avgDuration}m</span>
        </div>
        <div className="text-center">
          <span className="text-[8px] text-neo-muted font-extrabold uppercase tracking-widest block mb-0.5 font-sans">longest focus</span>
          <span className="text-sm font-black text-gray-950 dark:text-white">{insights.longestSession}m</span>
        </div>
        <div className="text-center">
          <span className="text-[8px] text-neo-muted font-extrabold uppercase tracking-widest block mb-0.5 font-sans">most used cat</span>
          <span className="text-sm font-black text-gray-950 dark:text-white lowercase truncate max-w-full block">
            {insights.mostUsedCategory === 'Project' ? 'projects' : insights.mostUsedCategory.toLowerCase()}
          </span>
        </div>
      </div>
    </Card>
  )
}

