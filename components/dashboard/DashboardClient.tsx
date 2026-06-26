'use client'

import React, { useState, useEffect } from 'react'
import { Edit3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UserProfile, StudyRoomInvitation } from '@/types'
import {
  fetchInvitations as fetchInvitationsService,
  acceptInvitation,
  declineInvitation,
  subscribeToInvitations,
  unsubscribeChannel
} from './services/dashboard.service'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useProjectsData } from '@/hooks/useProjectsData'
import { useMoodAndMemories } from '@/hooks/useMoodAndMemories'

import MotivationBanner from './components/MotivationBanner'
import PendingInvitations from './components/PendingInvitations'
import CareerPortfolioCard from './components/CareerPortfolioCard'
import StudyStatsCard from './components/StudyStatsCard'
import RoadmapMilestones from './components/RoadmapMilestones'
import TimelineActivity from './components/TimelineActivity'
import EditProfileModal from './components/EditProfileModal'

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
    addActivityLog,
    communityAchievements = []
  } = useDashboardData(activeUser, targetUserId)

  const isReadOnly = targetUserId ? (targetUserId !== activeUser?.id) : false

  const router = useRouter()
  const [pendingInvitations, setPendingInvitations] = useState<StudyRoomInvitation[]>([])

  // Fetch pending invitations
  const fetchInvitations = async () => {
    if (!activeUser) return
    const res = await fetchInvitationsService(activeUser.id)
    if (res.success && res.data) {
      setPendingInvitations(res.data as any)
    }
  }

  useEffect(() => {
    if (activeUser && !isReadOnly) {
      fetchInvitations()

      const sub = subscribeToInvitations(activeUser.id, () => {
        fetchInvitations()
      })

      return () => {
        unsubscribeChannel(sub)
      }
    }
  }, [activeUser, isReadOnly])

  const handleAcceptInvite = async (invitation: any) => {
    if (!activeUser) return
    try {
      const res = await acceptInvitation(invitation.room_id, activeUser.id, invitation.id)
      if (!res.success) throw res.error

      router.push(`/focus/${invitation.room_id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to join room.")
    }
  }

  const handleDeclineInvite = async (invitationId: string) => {
    try {
      const res = await declineInvitation(invitationId)
      if (!res.success) throw res.error
      
      setPendingInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (err) {
      console.error(err)
      alert("Failed to decline invitation.")
    }
  }

  const {
    projects,
    loading: projectsLoading
  } = useProjectsData(activeUser)

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
  const [techStackInput, setTechStackInput] = useState('')
  const [goalsInput, setGoalsInput] = useState('')
  const [certificationsInput, setCertificationsInput] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

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
      <MotivationBanner
        crewStats={crewStats}
        focusStats={focusStats}
        studyStats={studyStats}
      />

      {/* Pending Invitations Section */}
      <PendingInvitations
        pendingInvitations={pendingInvitations}
        handleDeclineInvite={handleDeclineInvite}
        handleAcceptInvite={handleAcceptInvite}
        avatarMap={AVATAR_MAP}
      />

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
        
        {/* COLUMN 1: PROFILE SUMMARY & CAREER ECOSYSTEM */}
        <CareerPortfolioCard
          careerProfile={careerProfile}
          targetUser={targetUser}
          userAvatar={userAvatar}
          moodLoading={moodLoading}
          latestMood={latestMood}
          isReadOnly={isReadOnly}
        />

        {/* COLUMN 2: STATS & ACTIVE WORKSPACES */}
        <StudyStatsCard
          focusStats={focusStats}
          studyStats={studyStats}
          focusSessions={focusSessions}
          studyHours={studyHours}
          weeklyTrend={weeklyTrend}
          projectsLoading={projectsLoading}
          projects={projects}
        />

        {/* COLUMN 3: ROADMAP & TIMELINE */}
        <div className="space-y-6 lg:col-span-1">
          <RoadmapMilestones
            localStages={localStages}
            roadmapItems={roadmapItems}
            isReadOnly={isReadOnly}
            handleDeleteStage={handleDeleteStage}
            editingItemId={editingItemId}
            editingItemTitle={editingItemTitle}
            setEditingItemTitle={setEditingItemTitle}
            editingItemStage={editingItemStage}
            setEditingItemStage={setEditingItemStage}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
            handleToggleGoal={handleToggleGoal}
            handleStartEdit={handleStartEdit}
            handleMoveItem={handleMoveItem}
            handleDeleteGoal={handleDeleteGoal}
            newGoalTitles={newGoalTitles}
            setNewGoalTitles={setNewGoalTitles}
            handleAddGoal={handleAddGoal}
            showAddStage={showAddStage}
            setShowAddStage={setShowAddStage}
            newStageName={newStageName}
            setNewStageName={setNewStageName}
            handleAddStage={handleAddStage}
          />

          <TimelineActivity
            communityAchievements={communityAchievements}
            activities={activities}
            isReadOnly={isReadOnly}
            achievementVisibility={careerProfile.achievement_visibility || 'public'}
            onUpdateVisibility={(val) => {
              updateCareerProfile({ achievement_visibility: val })
              addActivityLog('career_update', `Updated achievements visibility to ${val}.`)
            }}
          />
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          dreamCompany={dreamCompany}
          setDreamCompany={setDreamCompany}
          favoriteLanguage={favoriteLanguage}
          setFavoriteLanguage={setFavoriteLanguage}
          techStackInput={techStackInput}
          setTechStackInput={setTechStackInput}
          goalsInput={goalsInput}
          setGoalsInput={setGoalsInput}
          certificationsInput={certificationsInput}
          setCertificationsInput={setCertificationsInput}
          resumeUrl={resumeUrl}
          setResumeUrl={setResumeUrl}
          portfolioUrl={portfolioUrl}
          setPortfolioUrl={setPortfolioUrl}
          handleSaveProfile={handleSaveProfile}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

    </PageContainer>
  )
}
