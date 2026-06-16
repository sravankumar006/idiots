'use client'

import React, { useState } from 'react'
import {
  Sparkles, Clock, MessageSquare, FolderHeart, ArrowRight,
  Activity, Brain, Plus, Award, Briefcase, GraduationCap,
  GitBranch, BarChart2, CheckCircle2, User, Edit3, X, Calendar, RefreshCw, Heart,
  Trash2, Check, ChevronUp, ChevronDown, Trophy
} from 'lucide-react'
import Link from 'next/link'
import { UserProfile } from '@/types'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useProjectsData } from '@/hooks/useProjectsData'
import { useMoodAndMemories } from '@/hooks/useMoodAndMemories'

// Avatar config
const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-[#3A3530] to-[#2B2824]',  symbol: 'CS' },
  'avatar-neon-pulse':   { gradient: 'from-[#8A7968] to-[#5C4F42]',    symbol: 'MB' },
  'avatar-alpha-wing':   { gradient: 'from-[#606E59] to-[#3D4739]',   symbol: 'OM' },
  'avatar-solar-flare':  { gradient: 'from-[#A87955] to-[#704F34]',    symbol: 'WA' },
  'avatar-void-runner':  { gradient: 'from-[#A85840] to-[#703626]',      symbol: 'BR' },
  'avatar-shadow-blade': { gradient: 'from-[#2A2824] to-[#1C1A17]',   symbol: 'DC' },
}

interface DashboardClientProps {
  activeUser: UserProfile | null
  targetUserId?: string | null
}

export default function DashboardClient({ activeUser, targetUserId }: DashboardClientProps) {
  const {
    loading: dashLoading,
    careerProfile,
    codingStats,
    studyStats,
    activities,
    focusSessions = [],
    focusStats = { totalHours: 0, totalSessions: 0, weeklyMinutes: 0, monthlyMinutes: 0, collaborativeSessions: 0, streak: 0, goalBreakdown: {} },
    targetUser,
    crewStats = { weeklyFocusHours: 0, activeMembersToday: 0, activeSessions: 0, completedSessions: 0, totalActivities: 0, totalMemories: 0, totalChatMessages: 0 },
    roadmapItems = [],
    createRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    reorderRoadmapItems,
    updateCareerProfile,
    syncCodingPlatform,
    addActivityLog,
    communityAchievements = []
  } = useDashboardData(activeUser, targetUserId)

  const isReadOnly = targetUserId ? (targetUserId !== activeUser?.id) : false

  const {
    projects,
    loading: projectsLoading
  } = useProjectsData(activeUser)

  // Fetch mood data for Emotional Status
  const resolvedUserId = targetUser?.id || activeUser?.id
  const {
    moodLogs,
    loading: moodLoading
  } = useMoodAndMemories(resolvedUserId || null)

  const publicMoodLogs = moodLogs.filter(log => log.visibility !== 'private' || !isReadOnly)
  const latestMood = publicMoodLogs[0]

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [dreamCompany, setDreamCompany] = useState('')
  const [favoriteLanguage, setFavoriteLanguage] = useState('')
  const [bio, setBio] = useState('')
  const [techStackInput, setTechStackInput] = useState('')
  const [goalsInput, setGoalsInput] = useState('')
  const [certificationsInput, setCertificationsInput] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  // Syncing state loader
  const [isSyncing, setIsSyncing] = useState(false)

  // Learning Roadmap State
  const [localStages, setLocalStages] = useState<string[]>([])
  const [newStageName, setNewStageName] = useState('')
  const [showAddStage, setShowAddStage] = useState(false)
  const [newGoalTitles, setNewGoalTitles] = useState<Record<string, string>>({})
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemTitle, setEditingItemTitle] = useState('')
  const [editingItemStage, setEditingItemStage] = useState('')

  // Sync stages with roadmapItems
  React.useEffect(() => {
    if (roadmapItems.length > 0) {
      const uniqueStages = Array.from(new Set(roadmapItems.map(item => item.stage)))
      setLocalStages(prev => {
        const combined = [...uniqueStages]
        prev.forEach(stage => {
          if (!combined.includes(stage)) {
            combined.push(stage)
          }
        })
        return combined
      })
    } else {
      setLocalStages(prev => prev.length > 0 ? prev : ['General'])
    }
  }, [roadmapItems])

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault()
    const stage = newStageName.trim()
    if (!stage) return
    if (!localStages.includes(stage)) {
      setLocalStages(prev => [...prev, stage])
    }
    setNewStageName('')
    setShowAddStage(false)
  }

  const handleDeleteStage = async (stageName: string) => {
    const itemsToDelete = roadmapItems.filter(item => item.stage === stageName)
    const promises = itemsToDelete.map(item => deleteRoadmapItem(item.id))
    await Promise.all(promises)
    setLocalStages(prev => prev.filter(s => s !== stageName))
    await addActivityLog('roadmap_update', `Deleted stage: "${stageName}" and its goals.`)
  }

  const handleAddGoal = async (stage: string) => {
    const title = newGoalTitles[stage]?.trim()
    if (!title) return
    
    await createRoadmapItem(stage, title)
    setNewGoalTitles(prev => ({ ...prev, [stage]: '' }))
    await addActivityLog('roadmap_update', `Added goal: "${title}" to stage "${stage}"`)
  }

  const handleToggleGoal = async (item: any) => {
    const nextCompleted = !item.completed
    await updateRoadmapItem(item.id, { completed: nextCompleted })
    await addActivityLog(
      'roadmap_update',
      `${nextCompleted ? 'Completed' : 'Reset'} learning goal: "${item.title}"`
    )
  }

  const handleDeleteGoal = async (id: string, title: string) => {
    await deleteRoadmapItem(id)
    await addActivityLog('roadmap_update', `Deleted learning goal: "${title}"`)
  }

  const handleStartEdit = (item: any) => {
    setEditingItemId(item.id)
    setEditingItemTitle(item.title)
    setEditingItemStage(item.stage)
  }

  const handleSaveEdit = async (id: string) => {
    const trimmedTitle = editingItemTitle.trim()
    const trimmedStage = editingItemStage.trim()
    if (!trimmedTitle || !trimmedStage) return

    await updateRoadmapItem(id, { title: trimmedTitle, stage: trimmedStage })
    setEditingItemId(null)
    setEditingItemTitle('')
    setEditingItemStage('')
    await addActivityLog('roadmap_update', `Updated learning goal: "${trimmedTitle}"`)
  }

  const handleCancelEdit = () => {
    setEditingItemId(null)
    setEditingItemTitle('')
    setEditingItemStage('')
  }

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= roadmapItems.length) return

    let itemsCopy = [...roadmapItems].map((item, idx) => ({ ...item, display_order: idx }))
    const temp = itemsCopy[index]
    itemsCopy[index] = itemsCopy[targetIdx]
    itemsCopy[targetIdx] = temp

    itemsCopy = itemsCopy.map((item, idx) => ({ ...item, display_order: idx }))
    await reorderRoadmapItems(itemsCopy)
  }

  const openEditModal = () => {
    if (!careerProfile) return
    setDreamCompany(careerProfile.dream_company)
    setFavoriteLanguage(careerProfile.favorite_language)
    setBio(careerProfile.learning_roadmap.split('\n')[0] || '') // simple mock bio
    setTechStackInput(careerProfile.tech_stack.join(', '))
    setGoalsInput(careerProfile.target_goals.join(', '))
    setCertificationsInput(careerProfile.certifications.join(', '))
    setResumeUrl(careerProfile.resume_url || '')
    setPortfolioUrl(careerProfile.portfolio_url || '')
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditModalOpen(false)

    const techArray = techStackInput.split(',').map((t) => t.trim()).filter(Boolean)
    const goalsArray = goalsInput.split(',').map((g) => g.trim()).filter(Boolean)
    const certsArray = certificationsInput.split(',').map((c) => c.trim()).filter(Boolean)

    await updateCareerProfile({
      dream_company: dreamCompany,
      favorite_language: favoriteLanguage,
      tech_stack: techArray,
      target_goals: goalsArray,
      certifications: certsArray,
      resume_url: resumeUrl || null,
      portfolio_url: portfolioUrl || null
    })

    await addActivityLog('career_update', 'Updated career details, favorite stack, certifications, and goals.')
  }

  // Handle Sync Coding Stats
  const handleSyncStats = async () => {
    setIsSyncing(true)
    // artificial delay
    setTimeout(async () => {
      await syncCodingPlatform()
      setIsSyncing(false)
    }, 1500)
  }

  // Handle Interactive Roadmap Checkbox toggle
  const handleRoadmapToggle = async (index: number, lineText: string, isChecked: boolean) => {
    if (!careerProfile) return
    const lines = careerProfile.learning_roadmap.split('\n')
    const marker = isChecked ? '[x]' : '[ ]'
    
    // Replace checkbox marker
    lines[index] = lineText.replace(/^-\s*\[[ x/]+\]/, `- ${marker}`)
    const updatedRoadmap = lines.join('\n')

    await updateCareerProfile({ learning_roadmap: updatedRoadmap })
    await addActivityLog(
      'career_update',
      `${isChecked ? 'Completed' : 'Reset'} roadmap task: "${lineText.replace(/^-\s*\[[ x/]+\]\s*/, '')}"`
    )
  }

  if (dashLoading || !careerProfile || !codingStats || !studyStats) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">establishing secure node connection...</p>
        </div>
      </PageContainer>
    )
  }

  const userAvatar = AVATAR_MAP[targetUser?.avatar || ''] || { gradient: 'from-violet-400 to-indigo-500', symbol: 'EX' }

  // Simple statistics totals
  const totalSolved = codingStats.leetcode_solved + codingStats.hackerrank_solved + codingStats.codeforces_solved
  const studyHours = (studyStats.total_study_minutes / 60).toFixed(1)

  // Calculate actual daily study minutes for the last 7 days from focus sessions
  const getWeeklyTrend = () => {
    const days = ['s', 'm', 't', 'w', 't', 'f', 's']
    const now = new Date()
    const trendData: { dateStr: string; dayLabel: string; minutes: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      trendData.push({
        dateStr: d.toDateString(),
        dayLabel: days[d.getDay()],
        minutes: 0
      })
    }

    focusSessions.forEach(s => {
      const sDateStr = new Date(s.created_at).toDateString()
      const match = trendData.find(t => t.dateStr === sDateStr)
      if (match) {
        match.minutes += s.actual_minutes
      }
    })

    const maxMins = Math.max(...trendData.map(t => t.minutes), 30)
    return trendData.map(t => ({
      label: t.dayLabel,
      minutes: t.minutes,
      heightPercent: Math.min(100, Math.round((t.minutes / maxMins) * 100))
    }))
  }
  const weeklyTrend = getWeeklyTrend()

  return (
    <PageContainer>
      
      {/* Group Motivation Banner */}
      <Card className="mb-6 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">crew motivation status</span>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {crewStats && (crewStats.weeklyFocusHours > 0 || crewStats.activeMembersToday > 0 || crewStats.activeSessions > 0 || crewStats.completedSessions > 0 || crewStats.totalActivities > 0 || crewStats.totalMemories > 0 || crewStats.totalChatMessages > 0) ? (
                <>
                  The crew logged <span className="text-amber-500 font-bold">{crewStats.weeklyFocusHours}h focus time</span> this week. <span className="text-emerald-500 font-bold">{crewStats.activeMembersToday} member{crewStats.activeMembersToday !== 1 ? 's' : ''}</span> active today!
                </>
              ) : (
                "No activity data available yet"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-bold text-gray-600 dark:text-gray-300">
          study streak: <span className="text-rose-400 font-black">{focusStats.streak || studyStats.current_streak} days</span> 🔥
        </div>
      </Card>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-5">
        <SectionHeader 
          title={isReadOnly ? `${targetUser?.username || 'Explorer'}'s Hub` : "Growth Dashboard"} 
          description={isReadOnly ? `Overview of ${targetUser?.username || 'Explorer'}'s learning node and statistics.` : "Track progress, sync repositories, and build careers collaboratively."}
        />
        {!isReadOnly && (
          <button
            onClick={openEditModal}
            className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 mt-2 lg:mt-0"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Profile Summary</span>
          </button>
        )}
      </div>

      {/* Grid: 3-column system */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* ========================================================
            COLUMN 1: PROFILE SUMMARY & CAREER ECOSYSTEM
            ======================================================== */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* User Profile Card */}
          <Card className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar circle */}
              <div className={`h-20 w-20 rounded-full bg-gradient-to-tr ${userAvatar.gradient} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                {userAvatar.symbol}
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white lowercase">
                  @{targetUser?.username || 'Explorer'}
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Joined {new Date(targetUser?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Badges Stack */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {careerProfile.tech_stack.slice(0, 3).map((tech) => (
                  <span key={tech} className="text-[9px] font-bold bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full lowercase">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Dream / Targets */}
              <div className="w-full pt-4 border-t border-black/5 dark:border-white/5 space-y-2.5 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">favorite language:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{careerProfile.favorite_language || 'not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">target company:</span>
                  <span className="font-semibold text-amber-500">{careerProfile.dream_company || 'not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">internship:</span>
                  <span className="font-semibold text-emerald-500">{careerProfile.internship_status}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Emotional Status Card */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-400" />
              Emotional Status
            </h3>
            
            <div className="pt-2">
              {moodLoading ? (
                <p className="text-xs text-gray-500 font-medium animate-pulse">syncing emotional data...</p>
              ) : !latestMood ? (
                <p className="text-xs text-gray-500 font-medium">no emotional status tracked recently.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{latestMood.mood_label?.split(' ')[0] || '😐'}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        "{latestMood.status_text || 'stable state.'}"
                      </p>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 block">
                        {new Date(latestMood.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t border-black/5 dark:border-white/5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wider">energy level</span>
                      <span className="text-gray-500">{latestMood.energy_level}/10</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-400 to-rose-400 h-full rounded-full" style={{ width: `${(latestMood.energy_level / 10) * 100}%` }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wider">focus level</span>
                      <span className="text-gray-500">{latestMood.focus_level}/10</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full" style={{ width: `${(latestMood.focus_level / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Career Links & Certifications */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-violet-400" />
              Career Portfolio
            </h3>
            
            <div className="space-y-3.5 pt-2 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Resume link</span>
                {careerProfile.resume_url ? (
                  <a href={careerProfile.resume_url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline font-bold truncate block">
                    {careerProfile.resume_url}
                  </a>
                ) : (
                  <span className="text-gray-500 font-medium">No resume linked yet</span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Portfolio website</span>
                {careerProfile.portfolio_url ? (
                  <a href={careerProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline font-bold truncate block">
                    {careerProfile.portfolio_url}
                  </a>
                ) : (
                  <span className="text-gray-500 font-medium">No portfolio linked yet</span>
                )}
              </div>

              {/* Certification badges */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Certifications</span>
                {careerProfile.certifications && careerProfile.certifications.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {careerProfile.certifications.map((cert) => (
                      <div key={cert} className="flex items-center gap-2 neo-inset-panel p-2 rounded-xl">
                        <Award className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{cert}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-500 border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01]">
                    No certifications added yet.
                  </div>
                )}
              </div>
            </div>
          </Card>

        </div>

        {/* ========================================================
            COLUMN 2: STATS & ACTIVE WORKSPACES
            ======================================================== */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Coding Stats Card */}
          <Card className="p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                Coding Platforms
              </h3>
            </div>

            <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01]">
              <GitBranch className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2 stroke-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
                Connect coding profiles to track coding progress.
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                Future integrations: GitHub, LeetCode, Codeforces, HackerRank
              </p>
            </div>
          </Card>

          {/* Study Stats Card */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-rose-400" />
              Focus & Study Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="neo-inset-panel p-3 rounded-2xl">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">completed hours</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{focusStats.totalHours || studyHours}h</span>
              </div>
              <div className="neo-inset-panel p-3 rounded-2xl">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">pomodoros done</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{studyStats.completed_pomodoros}</span>
              </div>
              <div className="neo-inset-panel p-3 rounded-2xl">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">weekly focus</span>
                <span className="text-xl font-bold text-amber-500">{Math.round(focusStats.weeklyMinutes / 60)}h {focusStats.weeklyMinutes % 60}m</span>
              </div>
              <div className="neo-inset-panel p-3 rounded-2xl">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">monthly focus</span>
                <span className="text-xl font-bold text-cyan-400">{Math.round(focusStats.monthlyMinutes / 60)}h {focusStats.monthlyMinutes % 60}m</span>
              </div>
            </div>

            {/* Collaborative Focus Session stats */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-xs">
              <span className="text-gray-400 font-semibold lowercase">collaborative sessions:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{focusStats.collaborativeSessions} session{focusStats.collaborativeSessions !== 1 ? 's' : ''}</span>
            </div>

            {/* Goal breakdown tags */}
            {focusStats.goalBreakdown && Object.keys(focusStats.goalBreakdown).length > 0 && (
              <div className="pt-2.5 border-t border-black/5 dark:border-white/5 space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">focus goals breakdown</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(focusStats.goalBreakdown).map(([goal, count]) => (
                    <span key={goal} className="text-[9px] font-bold neo-inset-panel text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full lowercase">
                      {goal}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly trend chart */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">7-day focus activity</span>
              <div className="flex items-end justify-between h-14 px-2 pt-2">
                {weeklyTrend.map((t, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 w-6">
                    <div 
                      className="w-full bg-gradient-to-t from-violet-500 to-rose-400 rounded-t-md hover:opacity-80 transition-all cursor-pointer" 
                      style={{ height: `${t.heightPercent}%` }} 
                      title={`${t.minutes}m focused`} 
                    />
                    <span className="text-[8px] font-bold text-gray-400 lowercase">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Accomplishments Feed */}
            {focusSessions.length > 0 && (
              <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">recent accomplishments</span>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                  {focusSessions.filter(s => s.accomplishments).slice(0, 3).map((s) => (
                    <div key={s.id} className="neo-inset-panel p-2.5 rounded-xl text-[11px] leading-relaxed">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-gray-800 dark:text-gray-200 lowercase">{s.goal}</span>
                        <span className="text-[9px] text-amber-500 font-bold">{s.actual_minutes}m</span>
                      </div>
                      <p className="text-gray-500 font-medium">{s.accomplishments}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Active Projects Feed */}
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FolderHeart className="h-4 w-4 text-amber-500" />
                Active Projects
              </h3>
              <Link href="/growth/creative" className="text-[10px] text-violet-500 font-bold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {projectsLoading ? (
                <p className="text-xs text-gray-500 font-medium text-center">loading project spaces...</p>
              ) : projects.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium text-center py-2">no projects established yet.</p>
              ) : (
                projects.slice(0, 2).map((proj) => (
                  <Link key={proj.id} href={`/growth/creative/${proj.id}`} className="block neo-inset-panel p-3 rounded-2xl hover:border-violet-500/30 transition-all group">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-violet-500 transition-colors lowercase">{proj.name}</span>
                      <span className="text-[9px] text-gray-400 font-semibold">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

        </div>

        {/* ========================================================
            COLUMN 3: ROADMAP & TIMELINE
            ======================================================== */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Interactive Learning Roadmap */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-violet-500" />
              Learning Roadmap
            </h3>

            <div className="space-y-6 pt-2">
              {localStages.map((stage) => {
                const stageItems = roadmapItems.filter(item => item.stage === stage)
                
                return (
                  <div key={stage} className="space-y-2.5">
                    {/* Stage Header */}
                    <div className="border-b border-black/5 dark:border-white/5 pb-1.5 flex items-center justify-between group/stage">
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 lowercase tracking-wide">
                        {stage}
                      </span>
                      {!isReadOnly && localStages.length > 1 && (
                        <button
                          onClick={() => handleDeleteStage(stage)}
                          className="opacity-0 group-hover/stage:opacity-100 transition-opacity p-1 rounded hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 cursor-pointer"
                          title={`Delete stage "${stage}"`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Goals under this stage */}
                    <div className="space-y-1">
                      {stageItems.length > 0 ? (
                        stageItems.map((item) => {
                          const globalIdx = roadmapItems.findIndex(i => i.id === item.id)
                          return (
                            <div key={item.id} className="group/item flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all">
                              {editingItemId === item.id ? (
                                <div className="flex flex-col gap-2 w-full">
                                  <input
                                    type="text"
                                    value={editingItemTitle}
                                    onChange={(e) => setEditingItemTitle(e.target.value)}
                                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg px-2.5 py-1 text-gray-800 dark:text-white font-semibold text-xs"
                                    placeholder="Goal title"
                                  />
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={editingItemStage}
                                      onChange={(e) => setEditingItemStage(e.target.value)}
                                      className="bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/5 dark:border-white/5 rounded-lg px-2 py-1 text-gray-800 dark:text-white font-semibold text-[10px]"
                                    >
                                      {localStages.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                    <div className="flex items-center gap-1.5 ml-auto">
                                      <button
                                        onClick={() => handleSaveEdit(item.id)}
                                        className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 cursor-pointer"
                                        title="Save"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                                        title="Cancel"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={item.completed}
                                      disabled={isReadOnly}
                                      onChange={() => handleToggleGoal(item)}
                                      className="mt-0.5 h-3.5 w-3.5 rounded border-black/10 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                      id={`goal-item-${item.id}`}
                                    />
                                    <label
                                      htmlFor={`goal-item-${item.id}`}
                                      className={`font-semibold cursor-pointer truncate ${
                                        item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {item.title}
                                    </label>
                                  </div>
                                  
                                  {!isReadOnly && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-all ml-2 shrink-0">
                                      <button
                                        onClick={() => handleStartEdit(item)}
                                        className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                                        title="Edit goal"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveItem(globalIdx, 'up')}
                                        disabled={globalIdx === 0}
                                        className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                        title="Move Up"
                                      >
                                        <ChevronUp className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveItem(globalIdx, 'down')}
                                        disabled={globalIdx === roadmapItems.length - 1}
                                        className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                        title="Move Down"
                                      >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteGoal(item.id, item.title)}
                                        className="p-0.5 rounded-lg hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 cursor-pointer"
                                        title="Delete goal"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-[10px] text-gray-500 font-medium pl-2 italic">No goals added yet.</p>
                      )}
                    </div>

                    {/* Add goal inside this stage */}
                    {!isReadOnly && (
                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <input
                          type="text"
                          placeholder={`+ add goal to ${stage}...`}
                          value={newGoalTitles[stage] || ''}
                          onChange={(e) => setNewGoalTitles(prev => ({ ...prev, [stage]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddGoal(stage)
                          }}
                          className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl px-2.5 py-1 text-gray-800 dark:text-white font-semibold text-[10px] focus:outline-none focus:border-violet-500/30"
                        />
                        <button
                          onClick={() => handleAddGoal(stage)}
                          className="glass-button p-1 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                          title="Add goal"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add New Stage section */}
              {!isReadOnly && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5">
                  {showAddStage ? (
                    <form onSubmit={handleAddStage} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Stage name (e.g. Backend Roadmap)..."
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl px-3 py-1.5 text-gray-800 dark:text-white font-semibold text-xs focus:outline-none focus:border-violet-500/30"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="glass-button px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddStage(false)}
                        className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddStage(true)}
                      className="w-full border border-dashed border-black/10 dark:border-white/10 rounded-2xl py-2 px-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add New Stage</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Community Achievements Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Community Achievements
              </h3>
              
              {!isReadOnly && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">visibility:</span>
                  <select
                    value={careerProfile.achievement_visibility || 'public'}
                    onChange={(e) => {
                      updateCareerProfile({ achievement_visibility: e.target.value })
                      addActivityLog('career_update', `Updated achievements visibility to ${e.target.value}.`)
                    }}
                    className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg px-2 py-0.5 text-gray-800 dark:text-white font-semibold text-[10px] focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="public" className="bg-[#fefdfb] dark:bg-[#1c1f26]">Public</option>
                    <option value="workspace" className="bg-[#fefdfb] dark:bg-[#1c1f26]">Workspace</option>
                    <option value="friends" className="bg-[#fefdfb] dark:bg-[#1c1f26]">Friends</option>
                    <option value="private" className="bg-[#fefdfb] dark:bg-[#1c1f26]">Private</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-1 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {communityAchievements.length > 0 ? (
                communityAchievements.slice(0, 8).map((ach) => {
                  const avatarSymbol = ach.profiles?.username?.slice(0, 2).toUpperCase() || 'EX'
                  
                  return (
                    <div key={ach.id} className="flex items-start gap-2.5 text-xs py-1.5 border-b border-black/[0.03] dark:border-white/[0.03] last:border-b-0">
                      <div className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[9px] font-black shrink-0">
                        {avatarSymbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          <span className="font-bold text-gray-900 dark:text-white lowercase">@{ach.profiles?.username || 'Explorer'}</span>{' '}
                          <span className="text-gray-500">{ach.verb}</span>{' '}
                          <span className="font-bold text-amber-500">{ach.title}</span>
                        </p>
                        <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                          {new Date(ach.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01]">
                  No recent milestones shared.
                </div>
              )}
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-400" />
              Workspace Timeline
            </h3>

            <div className="relative pl-4 border-l border-black/5 dark:border-white/5 space-y-5 pt-2">
              {activities.slice(0, 5).map((act) => {
                let dotColor = 'bg-violet-400'
                if (act.activity_type === 'study_session') dotColor = 'bg-amber-400'
                if (act.activity_type === 'coding_solve') dotColor = 'bg-emerald-400'
                if (act.activity_type === 'career_update') dotColor = 'bg-cyan-400'

                return (
                  <div key={act.id} className="relative space-y-1 text-xs">
                    {/* Circle marker */}
                    <span className={`absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#1a1d24] ${dotColor}`} />
                    
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-semibold">
                      {new Date(act.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 leading-relaxed pr-1">{act.description}</p>
                  </div>
                )
              })}
            </div>
          </Card>

        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
              edit profile summary
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Target Company</label>
                  <input
                    type="text"
                    value={dreamCompany}
                    onChange={(e) => setDreamCompany(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Favorite Lang</label>
                  <input
                    type="text"
                    value={favoriteLanguage}
                    onChange={(e) => setFavoriteLanguage(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="React, TypeScript, Next.js, Node.js"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Target Goals (comma separated)</label>
                <input
                  type="text"
                  value={goalsInput}
                  onChange={(e) => setGoalsInput(e.target.value)}
                  placeholder="Solve 300 DSA problems, Polish LinkedIn"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Certifications (comma separated)</label>
                <input
                  type="text"
                  value={certificationsInput}
                  onChange={(e) => setCertificationsInput(e.target.value)}
                  placeholder="AWS Solutions Architect, Google Cloud Developer"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Resume Link</label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Portfolio Link</label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://myportfolio.space"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
                >
                  Save Summary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageContainer>
  )
}
