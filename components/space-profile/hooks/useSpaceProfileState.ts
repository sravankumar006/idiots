import { useState, useEffect, useMemo } from 'react'
import { UserProfile } from '@/types'
import { useUserSpace } from '@/hooks/useUserSpace'
import { useMoodAndMemories } from '@/hooks/useMoodAndMemories'
import { useDashboardData } from '@/hooks/useDashboardData'
import { ProfileIntegration } from '../types/space-profile.types'
import {
  getTargetProfile,
  getProfileIntegration,
  getProjects,
  getAchievements,
  getActivityLogs,
  getFocusSessions,
  saveProfileIntegration,
  getCurrentUserProfile,
  fetchGitHubCache,
  subscribeToSpaceEvents,
  unsubscribeChannels
} from '../services/space-profile.service'

export function useSpaceProfileState(username: string) {
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
        const profileRes = await getCurrentUserProfile()
        let currentProfile: UserProfile | null = null

        if (profileRes.success && profileRes.data) {
          currentProfile = profileRes.data as UserProfile
          setActiveProfile(currentProfile)
        }

        const targetRes = await getTargetProfile(username)
        const target = targetRes.data

        if (targetRes.success && target) {
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
  }, [username])

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
        const res = await getProfileIntegration(targetProfile.id)

        if (res.success && res.data) {
          const data = res.data
          setIntegration(data as ProfileIntegration)
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
  }, [targetProfile])

  // Fetch active projects from Creative Rooms
  const fetchProjects = async () => {
    if (!targetProfile?.id) return
    setLoadingProjects(true)
    try {
      const res = await getProjects(targetProfile.id)
      
      if (res.success && res.data) {
        const data = res.data
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
      const res = await getAchievements(targetProfile.id)
      if (res.success && res.data) {
        setRecentAchievements(res.data)
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
      const res = await getActivityLogs(targetProfile.id)
      if (res.success && res.data) {
        setDbActivities(res.data)
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
      const res = await getFocusSessions(targetProfile.id)
      if (res.success && res.data) {
        setFocusSessions(res.data)
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

    const channels = subscribeToSpaceEvents(targetProfile.id, {
      onActivitiesChange: (payload) => {
        setDbActivities(prev => [payload.new, ...prev].slice(0, 40))
      },
      onProjectsChange: () => {
        fetchProjects()
      },
      onAchievementsChange: (payload) => {
        setRecentAchievements(prev => [payload.new, ...prev].slice(0, 5))
      },
      onFocusSessionsChange: () => {
        fetchFocusSessions()
      }
    })

    return () => {
      unsubscribeChannels(channels)
    }
  }, [targetProfile?.id])

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
        const res = await fetchGitHubCache(integration.github_username)
        if (res.success && res.data) {
          setGithubData(res.data)
        } else {
          setGithubError(res.error || 'Failed to load GitHub activity')
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

    await updateSpaceData({
      profile_banner: editingBanner,
      current_status: editingStatus,
      theme_colors: editingThemeColor,
      profile_wallpaper: editingWallpaper,
      profile_accents: editingAccents
    })

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
      const res = await saveProfileIntegration(updatedData)
      if (!res.success) throw res.error
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

  return {
    activeProfile,
    targetProfile,
    loadingProfile,
    integration,
    loadingIntegration,
    showConfig,
    setShowConfig,
    editingBanner,
    setEditingBanner,
    editingStatus,
    setEditingStatus,
    editingThemeColor,
    setEditingThemeColor,
    editingWallpaper,
    setEditingWallpaper,
    editingAccents,
    setEditingAccents,
    editingGithub,
    setEditingGithub,
    editingLinkedin,
    setEditingLinkedin,
    editingPortfolio,
    setEditingPortfolio,
    editingResume,
    setEditingResume,
    editingBio,
    setEditingBio,
    editingMission,
    setEditingMission,
    editingProgress,
    setEditingProgress,
    showMoodLog,
    setShowMoodLog,
    newMood,
    setNewMood,
    newEnergy,
    setNewEnergy,
    newFocus,
    setNewFocus,
    newStatus,
    setNewStatus,
    githubData,
    loadingGithub,
    githubError,
    dbActivities,
    loadingActivities,
    activeProjects,
    loadingProjects,
    recentAchievements,
    loadingAchievements,
    focusSessions,
    loadingFocus,
    loadingSpace,
    spaceData,
    isReadOnly,
    moodLogs,
    vaultItems,
    codingStats,
    openConfigModal,
    handleSaveConfig,
    handleSaveMood,
    combinedActivities,
    moodTrendSvg
  }
}
