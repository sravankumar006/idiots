import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile, StudyRoom, StudyRoomMember, StudyRoomComment, StudyRoomTimer } from '@/types'
import { calculateSeconds } from '@/lib/utils/time'
import {
  getRoomDetails,
  getMembers,
  getComments,
  getInvitations,
  getRoomTimer,
  toggleReadyStatus,
  postComment,
  leaveRoom as leaveRoomService,
  completeRoom as completeRoomService,
  startSession as startSessionService,
  updateTimerStatus,
  saveFocusSessionCompletion,
  getStudyStats,
  updateStudyStats,
  getCurrentUserProfile,
  getActiveFocusSession,
  createFocusSession,
  deleteFocusSession,
  updateFocusSessionNotes,
  checkOrCreateRoomMembership,
  setupPresenceChannel,
  subscribeToRoomChanges,
  unsubscribeChannel
} from '../services/focus-room.service'

export function useFocusRoomState(roomId: string) {
  const router = useRouter()

  // Core state
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [members, setMembers] = useState<StudyRoomMember[]>([])
  const [comments, setComments] = useState<StudyRoomComment[]>([])
  const [roomLoading, setRoomLoading] = useState(true)
  const [invitations, setInvitations] = useState<any[]>([])
  const [roomTimer, setRoomTimer] = useState<StudyRoomTimer | null>(null)

  // Chat comments form
  const [commentText, setCommentText] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)

  // Tab control states for Mobile-First layout
  const [lobbyTab, setLobbyTab] = useState<'chat' | 'crew'>('chat')
  const [sessionTab, setSessionTab] = useState<'timer' | 'crew' | 'chat'>('timer')

  // Local Focus session states
  const [selectedGoal, setSelectedGoal] = useState('Study')
  const [durationMinutes, setDurationMinutes] = useState(25)
  const [selectedTheme, setSelectedTheme] = useState('minimal_zen')
  const [isNoTimer, setIsNoTimer] = useState(false)
  const [customDurationInput, setCustomDurationInput] = useState('')

  // Active Timer & Fullscreen States
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [notes, setNotes] = useState('')
  const [notesSavedStatus, setNotesSavedStatus] = useState<'saved' | 'saving' | 'error'>('saved')

  // Reflection/Cataloging Modal
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [accomplishments, setAccomplishments] = useState('')
  const [reflectionRating, setReflectionRating] = useState(7)
  const [reflections, setReflections] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Focus Sounds audio center
  const [lofiPlaying, setLofiPlaying] = useState(false)
  const [lofiTrack, setLofiTrack] = useState('lo-fi late night session')
  const [volume, setVolume] = useState(40)
  const [ambientSounds, setAmbientSounds] = useState<Record<string, boolean>>({
    rain: false,
    forest: false,
    fireplace: false,
  })

  // Presence state
  const [presentUserIds, setPresentUserIds] = useState<Set<string>>(new Set())

  // Computed Values
  const myMemberRecord = useMemo(() => {
    if (!activeProfile) return null
    return members.find(m => m.user_id === activeProfile.id) || null
  }, [members, activeProfile])

  const isHost = useMemo(() => {
    if (!activeProfile || !room) return false
    return activeProfile.id === room.host_user_id
  }, [activeProfile, room])

  const mappedCrew = useMemo(() => {
    const memberCrew = members.map(m => {
      const isOnline = m.user_id === activeProfile?.id || presentUserIds.has(m.user_id)
      let status: 'offline' | 'joined' | 'ready' = 'offline'
      if (isOnline) {
        if (m.is_host) {
          status = 'ready'
        } else {
          status = m.status === 'ready' ? 'ready' : 'joined'
        }
      }
      return {
        id: m.id,
        user_id: m.user_id,
        username: m.profiles?.username || 'explorer',
        avatar: m.profiles?.avatar || 'avatar-cyber-ghost',
        is_host: m.is_host,
        is_pending: false,
        computedStatus: status
      }
    })

    const pendingCrew = invitations.map(i => {
      return {
        id: i.id,
        user_id: i.invitee_user_id,
        username: i.invitee_profile?.username || 'explorer',
        avatar: i.invitee_profile?.avatar || 'avatar-cyber-ghost',
        is_host: false,
        is_pending: true,
        computedStatus: 'offline' as const
      }
    })

    const joinedUserIds = new Set(memberCrew.map(c => c.user_id))
    const filteredPendingCrew = pendingCrew.filter(c => !joinedUserIds.has(c.user_id))

    return [...memberCrew, ...filteredPendingCrew].sort((a, b) => {
      if (a.is_host) return -1
      if (b.is_host) return 1
      if (a.is_pending && !b.is_pending) return 1
      if (!a.is_pending && b.is_pending) return -1
      return a.username.localeCompare(b.username)
    })
  }, [members, invitations, presentUserIds, activeProfile?.id])

  const participants = useMemo(() => {
    return members.filter(m => m.user_id !== room?.host_user_id)
  }, [members, room?.host_user_id])

  const everyoneReady = useMemo(() => {
    if (members.length === 0) return false
    const onlineMembers = members.filter(m => m.user_id === activeProfile?.id || presentUserIds.has(m.user_id))
    if (onlineMembers.length === 0) return false
    return onlineMembers.every(m => m.is_host || m.status === 'ready')
  }, [members, presentUserIds, activeProfile?.id])

  const readyCount = useMemo(() => {
    return mappedCrew.filter(c => c.computedStatus === 'ready').length
  }, [mappedCrew])

  const totalCount = mappedCrew.length
  const canStartSession = everyoneReady

  const displayDurationMinutes = useMemo(() => {
    return (roomTimer && roomTimer.status !== 'idle') 
      ? roomTimer.duration_minutes 
      : durationMinutes
  }, [roomTimer, durationMinutes])

  const displayIsNoTimer = useMemo(() => {
    return (roomTimer && roomTimer.status !== 'idle')
      ? roomTimer.duration_minutes === 0
      : isNoTimer
  }, [roomTimer, isNoTimer])

  // Data Fetch Helpers
  const fetchRoomDetails = async () => {
    try {
      const res = await getRoomDetails(roomId)
      if (res.success && res.data) {
        setRoom(res.data as any)
      } else {
        router.push('/focus')
      }
    } catch (err) {
      console.warn("Failed to load room details:", err)
    } finally {
      setRoomLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await getMembers(roomId)
      if (res.success && res.data) setMembers(res.data as any)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await getComments(roomId)
      if (res.success && res.data) setComments(res.data as any)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchInvitationsForRoom = async () => {
    try {
      const res = await getInvitations(roomId)
      if (res.success && res.data) setInvitations(res.data as any)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRoomTimer = async () => {
    try {
      const res = await getRoomTimer(roomId)
      if (res.success && res.data) {
        setRoomTimer(res.data as StudyRoomTimer)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Initial load
  useEffect(() => {
    const initPage = async () => {
      const profileRes = await getCurrentUserProfile()
      if (!profileRes.success || !profileRes.data) {
        router.push('/login')
        return
      }

      const prof = profileRes.data
      setActiveProfile(prof as UserProfile)

      // Check for active focus session in this room
      const activeSessionRes = await getActiveFocusSession(prof.id, roomId)

      if (activeSessionRes.success && activeSessionRes.data) {
        const activeSession = activeSessionRes.data
        setActiveSessionId(activeSession.id)
        setNotes(activeSession.notes || '')
        if (activeSession.goal) setSelectedGoal(activeSession.goal)
        if (activeSession.theme) setSelectedTheme(activeSession.theme)
      }

      await fetchRoomDetails()

      // Register Membership
      await checkOrCreateRoomMembership(roomId, prof.id)

      await fetchMembers()
      await fetchComments()
      await fetchInvitationsForRoom()
      await fetchRoomTimer()
    }
    
    initPage()
  }, [roomId])

  // Presence channel subscription
  useEffect(() => {
    if (!activeProfile) return

    const presenceChannel = setupPresenceChannel(roomId, activeProfile.id, activeProfile.username, (userIds) => {
      setPresentUserIds(userIds)
    })

    return () => {
      unsubscribeChannel(presenceChannel)
    }
  }, [activeProfile])

  // Realtime subscription for sync
  useEffect(() => {
    const roomsChannel = subscribeToRoomChanges(roomId, {
      onRoomDetails: () => fetchRoomDetails(),
      onMembers: () => fetchMembers(),
      onComments: () => fetchComments(),
      onInvitations: () => fetchInvitationsForRoom(),
      onTimer: () => fetchRoomTimer()
    })

    return () => {
      unsubscribeChannel(roomsChannel)
    }
  }, [roomId])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Authoritative Shared Timer Ticker Effect
  useEffect(() => {
    if (!roomTimer) {
      setElapsedSeconds(0)
      setIsActive(false)
      return
    }

    if (roomTimer.status === 'idle') {
      setElapsedSeconds(0)
      setIsActive(false)
      return
    }

    if (roomTimer.status === 'paused') {
      setElapsedSeconds(roomTimer.elapsed_seconds)
      setIsActive(false)
      return
    }

    if (roomTimer.status === 'completed') {
      setElapsedSeconds(roomTimer.duration_minutes * 60)
      setIsActive(false)
      return
    }

    if (roomTimer.status === 'running') {
      setIsActive(true)

      const initialElapsed = calculateSeconds(roomTimer)
      setElapsedSeconds(initialElapsed)

      const interval = setInterval(() => {
        const currentElapsed = calculateSeconds(roomTimer)
        const totalSeconds = roomTimer.duration_minutes * 60

        if (roomTimer.duration_minutes > 0 && currentElapsed >= totalSeconds) {
          setElapsedSeconds(totalSeconds)

          if (isHost) {
            clearInterval(interval)
            updateTimerStatus(roomId, {
              status: 'completed',
              elapsed_seconds: totalSeconds,
              start_time: null,
              updated_at: new Date().toISOString()
            }).catch(err => console.error("Failed to complete timer in DB:", err))
          }
        } else {
          setElapsedSeconds(currentElapsed)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [roomTimer, isHost])

  // Ensure user's focus session record is created & synced in the DB
  const ensureFocusSessionActive = async () => {
    if (!activeProfile || !roomTimer) return
    if (activeSessionId) return

    try {
      const activeSessionRes = await getActiveFocusSession(activeProfile.id, roomId)
      if (!activeSessionRes.success) throw activeSessionRes.error

      if (activeSessionRes.data) {
        const existingSession = activeSessionRes.data
        setActiveSessionId(existingSession.id)
        setNotes(existingSession.notes || '')
        if (existingSession.goal) setSelectedGoal(existingSession.goal)
        if (existingSession.theme) setSelectedTheme(existingSession.theme)
        return
      }

      if (roomTimer.status !== 'running' && roomTimer.status !== 'paused') {
        return
      }

      const finalGoal = selectedGoal
      const finalDuration = roomTimer.duration_minutes

      const newSessionRes = await createFocusSession({
        user_id: activeProfile.id,
        goal: finalGoal,
        duration_minutes: finalDuration === 0 ? null : finalDuration,
        actual_minutes: 0,
        elapsed_seconds: 0,
        theme: selectedTheme,
        notes: '',
        completed: false,
        group_id: roomId
      })

      if (!newSessionRes.success) throw newSessionRes.error
      if (newSessionRes.data) {
        setActiveSessionId(newSessionRes.data.id)
        setNotes('')
      }
    } catch (err) {
      console.error("Error ensuring focus session is active:", err)
    }
  }

  // Shared Timer State Lifecycle Synchronization Effect
  useEffect(() => {
    if (!roomTimer) return

    if (roomTimer.status === 'running') {
      setIsFullscreen(true)
      setShowCompletionModal(false)
      ensureFocusSessionActive()
    } else if (roomTimer.status === 'paused') {
      setIsFullscreen(true)
      ensureFocusSessionActive()
    } else if (roomTimer.status === 'completed') {
      if (activeSessionId) {
        setIsFullscreen(true)
        setShowCompletionModal(true)
      } else {
        setIsFullscreen(false)
        setShowCompletionModal(false)
      }
    } else if (roomTimer.status === 'idle') {
      setIsFullscreen(false)
      if (!showCompletionModal) {
        setActiveSessionId(null)
        setElapsedSeconds(0)
      }
    }
  }, [roomTimer?.status, activeSessionId])

  // User Notepad Auto-sync Effect
  useEffect(() => {
    if (!activeSessionId) return
    setNotesSavedStatus('saving')

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await updateFocusSessionNotes(activeSessionId, notes, elapsedSeconds)
        if (!res.success) throw res.error
        setNotesSavedStatus('saved')
      } catch (err) {
        console.warn("Notes sync fail:", err)
        setNotesSavedStatus('error')
      }
    }, 2000)

    return () => clearTimeout(delayDebounce)
  }, [notes, activeSessionId, elapsedSeconds])

  // Actions
  const handleToggleReady = async () => {
    if (!activeProfile || !myMemberRecord) return
    try {
      const res = await toggleReadyStatus(myMemberRecord.id, myMemberRecord.status)
      if (!res.success) throw res.error
    } catch (err) {
      console.error("Failed to toggle ready status:", err)
      alert("Failed to update readiness.")
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !activeProfile || isSendingComment) return
    setIsSendingComment(true)

    try {
      const res = await postComment(roomId, activeProfile.id, commentText)
      if (!res.success) throw res.error
      setCommentText('')
    } catch (err) {
      console.error(err)
      alert("Failed to send message.")
    } finally {
      setIsSendingComment(false)
    }
  }

  const handleLeaveRoom = async () => {
    if (!activeProfile) return
    if (!window.confirm("Leave this study cabin?")) return

    try {
      const res = await leaveRoomService(roomId, activeProfile.id)
      if (!res.success) throw res.error
      router.push('/focus')
    } catch (err) {
      console.error(err)
    }
  }

  const handleCompleteRoom = async () => {
    if (!room || !activeProfile) return
    if (!window.confirm("Are you sure you want to end this study session and complete the room?")) return

    try {
      const res = await completeRoomService(roomId)
      if (!res.success) throw res.error
      router.push('/focus')
    } catch (err) {
      console.error(err)
      alert("Failed to complete room status.")
    }
  }

  const handleStartSession = async () => {
    if (!activeProfile || !room || isStarting) return
    setIsStarting(true)

    const finalDuration = isNoTimer ? 0 : durationMinutes

    try {
      const res = await startSessionService(roomId, finalDuration)
      if (!res.success) throw res.error
    } catch (err) {
      console.error("Failed to start room timer:", err)
      alert("Failed to start study cabin session.")
    } finally {
      setIsStarting(false)
    }
  }

  const handleToggleTimer = async () => {
    if (!roomTimer || !isHost) return

    if (roomTimer.status === 'running') {
      const elapsed = calculateSeconds(roomTimer)
      try {
        const res = await updateTimerStatus(roomId, {
          status: 'paused',
          elapsed_seconds: elapsed,
          start_time: null,
          updated_at: new Date().toISOString()
        })
        if (!res.success) throw res.error
      } catch (err) {
        console.error("Failed to pause timer:", err)
        alert("Failed to pause timer.")
      }
    } else if (roomTimer.status === 'paused') {
      try {
        const res = await updateTimerStatus(roomId, {
          status: 'running',
          start_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        if (!res.success) throw res.error
      } catch (err) {
        console.error("Failed to resume timer:", err)
        alert("Failed to resume timer.")
      }
    }
  }

  const handleAbandonSession = async () => {
    if (isHost) {
      if (!window.confirm("Abandon this focus session for the entire cabin?")) return
      try {
        const res = await updateTimerStatus(roomId, {
          status: 'idle',
          elapsed_seconds: 0,
          start_time: null,
          updated_at: new Date().toISOString()
        })
        if (!res.success) throw res.error
      } catch (err) {
        console.error("Failed to abandon room timer:", err)
      }
    } else {
      if (!window.confirm("Abandon your focus session and exit? (The cabin timer will continue running for others)")) return
      if (activeSessionId) {
        await deleteFocusSession(activeSessionId)
      }
      setActiveSessionId(null)
      setIsFullscreen(false)
      setShowCompletionModal(false)
      setElapsedSeconds(0)
    }
  }

  const handleManualEndSession = async () => {
    if (!isHost) return
    try {
      const res = await updateTimerStatus(roomId, {
        status: 'completed',
        elapsed_seconds: displayDurationMinutes * 60,
        start_time: null,
        updated_at: new Date().toISOString()
      })
      if (!res.success) throw res.error
    } catch (err) {
      console.error("Failed to manually end session:", err)
    }
  }

  const handleSaveCompletion = async () => {
    if (!activeSessionId || !activeProfile) return
    setIsSubmitting(true)

    const actualMins = Math.max(1, Math.round(elapsedSeconds / 60))

    try {
      const completionRes = await saveFocusSessionCompletion(
        activeSessionId,
        actualMins,
        elapsedSeconds,
        accomplishments,
        reflectionRating,
        reflections
      )
      if (!completionRes.success) throw completionRes.error

      const statsRes = await getStudyStats(activeProfile.id)
      const stats = statsRes.data
      const nextMinutes = (stats?.total_study_minutes || 0) + actualMins
      const nextPomodoros = (stats?.completed_pomodoros || 0) + (displayIsNoTimer ? 0 : 1)

      const statsUpdateRes = await updateStudyStats(activeProfile.id, nextMinutes, nextPomodoros)
      if (!statsUpdateRes.success) throw statsUpdateRes.error

      if (isHost) {
        const timerRes = await updateTimerStatus(roomId, {
          status: 'idle',
          elapsed_seconds: 0,
          start_time: null,
          updated_at: new Date().toISOString()
        })
        if (!timerRes.success) throw timerRes.error
      }

      // Clear local states
      setActiveSessionId(null)
      setIsFullscreen(false)
      setShowCompletionModal(false)
      setAccomplishments('')
      setReflections('')
      setElapsedSeconds(0)
    } catch (err) {
      alert("Failed storing completed logs.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    router,
    activeProfile,
    room,
    members,
    comments,
    roomLoading,
    invitations,
    roomTimer,
    commentText,
    setCommentText,
    isSendingComment,
    lobbyTab,
    setLobbyTab,
    sessionTab,
    setSessionTab,
    selectedGoal,
    setSelectedGoal,
    durationMinutes,
    setDurationMinutes,
    selectedTheme,
    setSelectedTheme,
    isNoTimer,
    setIsNoTimer,
    customDurationInput,
    setCustomDurationInput,
    activeSessionId,
    isFullscreen,
    setIsFullscreen,
    isActive,
    elapsedSeconds,
    notes,
    setNotes,
    notesSavedStatus,
    showCompletionModal,
    setShowCompletionModal,
    accomplishments,
    setAccomplishments,
    reflectionRating,
    setReflectionRating,
    reflections,
    setReflections,
    isSubmitting,
    isStarting,
    mounted,
    lofiPlaying,
    setLofiPlaying,
    lofiTrack,
    setLofiTrack,
    volume,
    setVolume,
    ambientSounds,
    setAmbientSounds,
    presentUserIds,
    myMemberRecord,
    isHost,
    mappedCrew,
    participants,
    everyoneReady,
    readyCount,
    totalCount,
    canStartSession,
    displayDurationMinutes,
    displayIsNoTimer,
    handleToggleReady,
    handlePostComment,
    handleLeaveRoom,
    handleCompleteRoom,
    handleStartSession,
    handleToggleTimer,
    handleAbandonSession,
    handleManualEndSession,
    handleSaveCompletion
  }
}
