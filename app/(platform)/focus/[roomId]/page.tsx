'use client'

import React, { useState, useEffect, useRef, useMemo, use } from 'react'
import { 
  Play, Pause, Clock, X, ArrowLeft, BookText, Activity, Save, CheckCircle2,
  Volume2, VolumeX, Music, Radio, Wind, Moon, CloudRain, Users, Send, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, StudyRoom, StudyRoomMember, StudyRoomComment, StudyRoomTimer } from '@/types'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

const AMBIENT_THEMES = [
  { id: 'minimal_zen', name: 'Minimal Zen', bg: 'bg-[#fdfbf7] dark:bg-[#121110]', textColor: 'text-amber-900 dark:text-amber-100', accent: 'amber', description: 'Soft amber glow and calming breathing pulse' },
  { id: 'rain', name: 'Rain', bg: 'bg-[#f1f5f9] dark:bg-[#0f172a]', textColor: 'text-slate-900 dark:text-slate-100', accent: 'sky', description: 'Deep slate grey with animated rain droplets' },
  { id: 'aurora', name: 'Aurora', bg: 'bg-gradient-to-tr from-teal-900 via-indigo-900 to-purple-950', textColor: 'text-emerald-100', accent: 'emerald', description: 'Shifting northern lights gradient' },
  { id: 'deep_space', name: 'Deep Space', bg: 'bg-[#030712]', textColor: 'text-gray-100', accent: 'indigo', description: 'Pitch dark cosmos with twinkling stars' },
  { id: 'coding_cave', name: 'Coding Cave', bg: 'bg-[#090b10]', textColor: 'text-emerald-400 font-mono', accent: 'emerald', description: 'Retro digital cave with glowing outlines' },
  { id: 'ocean_depth', name: 'Ocean Depth', bg: 'bg-gradient-to-b from-[#0f1b29] to-[#02060d]', textColor: 'text-cyan-200', accent: 'cyan', description: 'Deep aquatic blue waves' }
]

const GOAL_OPTIONS = [
  { id: 'Study', name: 'Study', icon: Clock, color: 'text-indigo-400' },
  { id: 'Coding', name: 'Coding', icon: Clock, color: 'text-emerald-400' },
  { id: 'Research', name: 'Research', icon: Clock, color: 'text-cyan-400' },
  { id: 'Reading', name: 'Reading', icon: Clock, color: 'text-rose-400' },
  { id: 'Project Work', name: 'Project Work', icon: Clock, color: 'text-amber-400' },
]

const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-indigo-400 to-purple-500',  symbol: 'CM' },
  'avatar-neon-pulse':   { gradient: 'from-purple-400 to-pink-500',    symbol: 'SL' },
  'avatar-alpha-wing':   { gradient: 'from-emerald-400 to-teal-500',   symbol: 'MM' },
  'avatar-solar-flare':  { gradient: 'from-[#5E4545] to-[#8A6D6D] dark:from-[#ffb4b4] dark:to-[#ff8a8a]',    symbol: 'WP' },
  'avatar-void-runner':  { gradient: 'from-rose-400 to-pink-500',      symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500',   symbol: 'MS' },
}

interface PageProps {
  params: Promise<{ roomId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function StudyCabinDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  const roomId = resolvedParams.roomId
  const supabase = createClient()
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

  const myMemberRecord = useMemo(() => {
    if (!activeProfile) return null
    return members.find(m => m.user_id === activeProfile.id) || null
  }, [members, activeProfile])

  const mappedCrew = useMemo(() => {
    // 1. Map existing members
    const memberCrew = members.map(m => {
      const isOnline = m.user_id === activeProfile?.id || presentUserIds.has(m.user_id)
      let status: 'offline' | 'joined' | 'ready' = 'offline'
      if (isOnline) {
        if (m.is_host) {
          status = 'ready' // Host is automatically ready when online
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

    // 2. Map pending invitations
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

    // Ensure no duplicates just in case someone accepted but the sync is in-flight
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
    // Only check readiness for members who are currently online
    // Always treat the active logged-in user as online
    const onlineMembers = members.filter(m => m.user_id === activeProfile?.id || presentUserIds.has(m.user_id))
    if (onlineMembers.length === 0) return false
    return onlineMembers.every(m => m.is_host || m.status === 'ready')
  }, [members, presentUserIds, activeProfile?.id])

  const readyCount = useMemo(() => {
    return mappedCrew.filter(c => c.computedStatus === 'ready').length
  }, [mappedCrew])

  const totalCount = mappedCrew.length

  const canStartSession = everyoneReady

  const isHost = useMemo(() => {
    if (!activeProfile || !room) return false
    return activeProfile.id === room.host_user_id
  }, [activeProfile, room])

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

  // Presence channel subscription
  useEffect(() => {
    if (!activeProfile) return

    const presenceChannel = supabase.channel(`cabin-presence:${roomId}`, {
      config: {
        presence: {
          key: activeProfile.id,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState()
        const userIds = new Set<string>(Object.keys(presenceState))
        setPresentUserIds(userIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: activeProfile.id,
            username: activeProfile.username,
            onlineAt: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [supabase, roomId, activeProfile])

  const handleToggleReady = async () => {
    if (!activeProfile || !myMemberRecord) return
    const nextStatus = myMemberRecord.status === 'ready' ? 'joined' : 'ready'
    try {
      const { error } = await supabase
        .from('study_room_members')
        .update({ status: nextStatus })
        .eq('id', myMemberRecord.id)
      
      if (error) throw error
    } catch (err) {
      console.error("Failed to toggle ready status:", err)
      alert("Failed to update readiness.")
    }
  }

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll chat comments list
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  // 1. Initial Page Load (Fetch User, Room details, and Register Membership)
  const fetchRoomDetails = async () => {
    try {
      const { data: studyRoom, error } = await supabase
        .from('study_rooms')
        .select('*, profiles:host_user_id(username, avatar)')
        .eq('id', roomId)
        .maybeSingle()

      if (error) throw error

      if (studyRoom) {
        if (studyRoom.room_status === 'completed') {
          router.push('/focus')
          return
        }
        setRoom(studyRoom as any)
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
    const { data } = await supabase
      .from('study_room_members')
      .select('*, profiles:user_id(username, avatar)')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })
    if (data) setMembers(data as any)
  }

  const fetchComments = async () => {
    const { data } = await supabase
      .from('study_room_comments')
      .select('*, profiles:user_id(username, avatar)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (data) setComments(data as any)
  }

  const fetchInvitationsForRoom = async () => {
    const { data } = await supabase
      .from('study_room_invitations')
      .select('*, invitee_profile:invitee_user_id(username, avatar)')
      .eq('room_id', roomId)
      .eq('status', 'pending')
    if (data) setInvitations(data as any)
  }

  const fetchRoomTimer = async () => {
    const { data, error } = await supabase
      .from('study_room_timers')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle()
    if (!error && data) {
      setRoomTimer(data as StudyRoomTimer)
    }
  }

  useEffect(() => {
    const initPage = async () => {
      // Fetch user profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (!prof) return
      setActiveProfile(prof as UserProfile)

      // Check for active focus session in this room
      const { data: activeSession } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', roomId)
        .eq('completed', false)
        .maybeSingle()

      if (activeSession) {
        setActiveSessionId(activeSession.id)
        setNotes(activeSession.notes || '')
        if (activeSession.goal) setSelectedGoal(activeSession.goal)
        if (activeSession.theme) setSelectedTheme(activeSession.theme)
      }

      // Fetch room details
      await fetchRoomDetails()

      // Register Membership (join room if not host and not joined yet)
      const { data: existingMember } = await supabase
        .from('study_room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingMember) {
        await supabase.from('study_room_members').insert({
          room_id: roomId,
          user_id: user.id,
          is_host: false
        })

        // Accept the invitation if one exists
        await supabase
          .from('study_room_invitations')
          .update({ status: 'accepted' })
          .eq('room_id', roomId)
          .eq('invitee_user_id', user.id)
          .eq('status', 'pending')
      } else {
        // Even if they are already in the room, mark pending invite as accepted
        await supabase
          .from('study_room_invitations')
          .update({ status: 'accepted' })
          .eq('room_id', roomId)
          .eq('invitee_user_id', user.id)
          .eq('status', 'pending')
      }

      // Fetch members, comments, invitations, and timer
      await fetchMembers()
      await fetchComments()
      await fetchInvitationsForRoom()
      await fetchRoomTimer()
    }
    
    initPage()
  }, [supabase, roomId])

  // 2. Realtime sync connections (Rooms, Members, Comments, Invitations, Timers)
  useEffect(() => {
    const roomsChannel = supabase.channel(`cabin-sync:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_rooms', filter: `id=eq.${roomId}` },
        () => fetchRoomDetails()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_members', filter: `room_id=eq.${roomId}` },
        () => fetchMembers()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_comments', filter: `room_id=eq.${roomId}` },
        () => fetchComments()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_invitations', filter: `room_id=eq.${roomId}` },
        () => fetchInvitationsForRoom()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_timers', filter: `room_id=eq.${roomId}` },
        () => fetchRoomTimer()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomsChannel)
    }
  }, [supabase, roomId])

  // 3. Post a comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !activeProfile || isSendingComment) return
    setIsSendingComment(true)

    try {
      const { error } = await supabase
        .from('study_room_comments')
        .insert({
          room_id: roomId,
          user_id: activeProfile.id,
          message: commentText.trim()
        })

      if (error) throw error
      setCommentText('')
    } catch (err) {
      console.error(err)
      alert("Failed to send message.")
    } finally {
      setIsSendingComment(false)
    }
  }

  // 4. Leave study room
  const handleLeaveRoom = async () => {
    if (!activeProfile) return
    if (!window.confirm("Leave this study cabin?")) return

    try {
      await supabase
        .from('study_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', activeProfile.id)

      router.push('/focus')
    } catch (err) {
      console.error(err)
    }
  }

  // 5. Complete Study Session (For host only)
  const handleCompleteRoom = async () => {
    if (!room || !activeProfile) return
    if (!window.confirm("Are you sure you want to end this study session and complete the room?")) return

    try {
      const { error } = await supabase
        .from('study_rooms')
        .update({
          room_status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', roomId)

      if (error) throw error
      router.push('/focus')
    } catch (err) {
      console.error(err)
      alert("Failed to complete room status.")
    }
  }

  // Helper to ensure user's focus session record is created & synced in the DB
  const ensureFocusSessionActive = async () => {
    if (!activeProfile || !roomTimer) return

    if (activeSessionId) return

    try {
      const { data: existingSession, error: checkError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', activeProfile.id)
        .eq('group_id', roomId)
        .eq('completed', false)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingSession) {
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

      const { data: newSession, error: insertError } = await supabase
        .from('focus_sessions')
        .insert({
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
        .select()
        .single()

      if (insertError) throw insertError
      if (newSession) {
        setActiveSessionId(newSession.id)
        setNotes('')
      }
    } catch (err) {
      console.error("Error ensuring focus session is active:", err)
    }
  }

  // 1. Authoritative Shared Timer Ticker Effect
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

      const calculateSeconds = () => {
        if (!roomTimer.start_time) return roomTimer.elapsed_seconds
        const startMs = new Date(roomTimer.start_time).getTime()
        const nowMs = Date.now()
        const diffSecs = Math.floor((nowMs - startMs) / 1000)
        return roomTimer.elapsed_seconds + diffSecs
      }

      const initialElapsed = calculateSeconds()
      setElapsedSeconds(initialElapsed)

      const interval = setInterval(() => {
        const currentElapsed = calculateSeconds()
        const totalSeconds = roomTimer.duration_minutes * 60

        if (roomTimer.duration_minutes > 0 && currentElapsed >= totalSeconds) {
          setElapsedSeconds(totalSeconds)

          if (isHost) {
            clearInterval(interval)
            supabase.from('study_room_timers')
              .update({
                status: 'completed',
                elapsed_seconds: totalSeconds,
                start_time: null,
                updated_at: new Date().toISOString()
              })
              .eq('room_id', roomId)
              .then(({ error }) => {
                if (error) console.error("Failed to complete timer in DB:", error)
              })
          }
        } else {
          setElapsedSeconds(currentElapsed)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [roomTimer, isHost, roomId, supabase])

  // 2. Shared Timer State Lifecycle Synchronization Effect
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

  // 3. User Notepad Auto-sync Effect
  useEffect(() => {
    if (!activeSessionId) return
    setNotesSavedStatus('saving')

    const delayDebounce = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('focus_sessions')
          .update({ notes, elapsed_seconds: elapsedSeconds })
          .eq('id', activeSessionId)
        if (error) throw error
        setNotesSavedStatus('saved')
      } catch (err) {
        console.warn("Notes sync fail:", err)
        setNotesSavedStatus('error')
      }
    }, 2000)

    return () => clearTimeout(delayDebounce)
  }, [notes, activeSessionId, elapsedSeconds, supabase])

  // Start Focus (Host-only command to trigger timer for everyone)
  const handleStartSession = async () => {
    if (!activeProfile || !room || isStarting) return
    setIsStarting(true)

    const finalDuration = isNoTimer ? 0 : durationMinutes

    try {
      const { error } = await supabase
        .from('study_room_timers')
        .upsert({
          room_id: roomId,
          start_time: new Date().toISOString(),
          duration_minutes: finalDuration,
          status: 'running',
          elapsed_seconds: 0,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (err) {
      console.error("Failed to start room timer:", err)
      alert("Failed to start study cabin session.")
    } finally {
      setIsStarting(false)
    }
  }

  // Toggle Timer Play/Pause (Host-only)
  const handleToggleTimer = async () => {
    if (!roomTimer || !isHost) return

    if (roomTimer.status === 'running') {
      const startMs = new Date(roomTimer.start_time!).getTime()
      const diffSecs = Math.floor((Date.now() - startMs) / 1000)
      const newElapsed = roomTimer.elapsed_seconds + diffSecs

      try {
        const { error } = await supabase
          .from('study_room_timers')
          .update({
            status: 'paused',
            elapsed_seconds: newElapsed,
            start_time: null,
            updated_at: new Date().toISOString()
          })
          .eq('room_id', roomId)
        
        if (error) throw error
      } catch (err) {
        console.error("Failed to pause timer:", err)
        alert("Failed to pause timer.")
      }
    } else if (roomTimer.status === 'paused') {
      try {
        const { error } = await supabase
          .from('study_room_timers')
          .update({
            status: 'running',
            start_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('room_id', roomId)

        if (error) throw error
      } catch (err) {
        console.error("Failed to resume timer:", err)
        alert("Failed to resume timer.")
      }
    }
  }

  // Abandon/Exit Session (Host abandons for room, participant abandons locally)
  const handleAbandonSession = async () => {
    if (isHost) {
      if (!window.confirm("Abandon this focus session for the entire cabin?")) return
      try {
        const { error } = await supabase
          .from('study_room_timers')
          .update({
            status: 'idle',
            elapsed_seconds: 0,
            start_time: null,
            updated_at: new Date().toISOString()
          })
          .eq('room_id', roomId)
        if (error) throw error
      } catch (err) {
        console.error("Failed to abandon room timer:", err)
      }
    } else {
      if (!window.confirm("Abandon your focus session and exit? (The cabin timer will continue running for others)")) return
      if (activeSessionId) {
        await supabase.from('focus_sessions').delete().eq('id', activeSessionId)
      }
      setActiveSessionId(null)
      setIsFullscreen(false)
      setShowCompletionModal(false)
      setElapsedSeconds(0)
    }
  }

  // Manual End Session (Host-only)
  const handleManualEndSession = async () => {
    if (!isHost) return
    try {
      const { error } = await supabase
        .from('study_room_timers')
        .update({
          status: 'completed',
          elapsed_seconds: displayDurationMinutes * 60,
          start_time: null,
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId)
      if (error) throw error
    } catch (err) {
      console.error("Failed to manually end session:", err)
    }
  }

  // Save Completed Session Statistics
  const handleSaveCompletion = async () => {
    if (!activeSessionId || !activeProfile) return
    setIsSubmitting(true)

    const actualMins = Math.max(1, Math.round(elapsedSeconds / 60))

    try {
      const { error: sessionErr } = await supabase
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
      if (sessionErr) throw sessionErr

      // Update study stats
      const { data: stats } = await supabase
        .from('study_stats')
        .select('*')
        .eq('user_id', activeProfile.id)
        .maybeSingle()

      const nextMinutes = (stats?.total_study_minutes || 0) + actualMins
      const nextPomodoros = (stats?.completed_pomodoros || 0) + (displayIsNoTimer ? 0 : 1)

      await supabase
        .from('study_stats')
        .update({
          total_study_minutes: nextMinutes,
          completed_pomodoros: nextPomodoros,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', activeProfile.id)

      // If host, reset the room timer to idle
      if (isHost) {
        await supabase
          .from('study_room_timers')
          .update({
            status: 'idle',
            elapsed_seconds: 0,
            start_time: null,
            updated_at: new Date().toISOString()
          })
          .eq('room_id', roomId)
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

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (roomLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-neo-bg">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-500 lowercase">syncing focus cabin data...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-neo-bg">
        <p className="text-sm font-bold text-gray-500">Cabin not found.</p>
        <button onClick={() => router.push('/focus')} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold h-11">
          Back to Lounge
        </button>
      </div>
    )
  }

  const hostProfile = (room as any).profiles
  const progressPercent = displayIsNoTimer ? 100 : Math.min(100, (elapsedSeconds / (displayDurationMinutes * 60)) * 100)
  const currentThemeConfig = AMBIENT_THEMES.find(t => t.id === selectedTheme) || AMBIENT_THEMES[0]

  if (isFullscreen) {
    const activeSidebarTab = sessionTab === 'timer' ? 'chat' : sessionTab;

    return (
      <div className={`flex flex-col w-full h-[100dvh] select-none relative overflow-hidden ${currentThemeConfig.bg}`}>
        
        {/* Background patterns/animations */}
        {selectedTheme === 'minimal_zen' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-[60vw] w-[60vw] rounded-full bg-amber-500/5 dark:bg-amber-500/[0.03] blur-3xl animate-breathing" />
          </div>
        )}

        {selectedTheme === 'rain' && (
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="rainPatternSub" width="40" height="40" patternUnits="userSpaceOnUse">
                  <line x1="10" y1="0" x2="10" y2="20" stroke="rgba(14, 165, 233, 0.4)" strokeWidth="1" />
                  <line x1="30" y1="20" x2="30" y2="40" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#rainPatternSub)" className="animate-rain-fall" />
            </svg>
          </div>
        )}

        {selectedTheme === 'aurora' && (
          <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.15),transparent_60%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_60%)] animate-aurora" />
        )}

        {selectedTheme === 'deep_space' && (
          <div className="absolute inset-0 pointer-events-none opacity-80">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className="absolute bg-white rounded-full animate-twinkle" 
                style={{
                  top: `${(i * 7 + 13) % 95}%`,
                  left: `${(i * 13 + 7) % 95}%`,
                  width: `${(i % 3) + 1.5}px`,
                  height: `${(i % 3) + 1.5}px`,
                  animationDelay: `${i * 0.4}s`
                }}
              />
            ))}
          </div>
        )}

        {selectedTheme === 'coding_cave' && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />
        )}

        {selectedTheme === 'ocean_depth' && (
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-radial from-[#1e40af]/20 to-transparent blur-3xl animate-ocean" />
        )}

        {/* Active Session Header */}
        <header className="relative z-10 flex items-center justify-between px-4 lg:px-6 h-14 shrink-0 border-b border-white/5 bg-transparent max-w-6xl mx-auto w-full">
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none block">cabin focus active</span>
            <h3 className="text-xs font-black text-white lowercase mt-0.5">{selectedGoal}</h3>
          </div>

          <button
            onClick={handleAbandonSession}
            className="py-2 px-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-black tracking-wide lowercase cursor-pointer flex items-center gap-1.5 h-9"
          >
            <X className="h-4 w-4 shrink-0" />
            <span>{isHost ? 'abandon' : 'leave'}</span>
          </button>
        </header>

        {/* Main content body (Responsive Layout) */}
        <div className="flex-1 overflow-y-auto lg:overflow-visible min-h-0 relative z-10 max-w-6xl mx-auto w-full px-4 lg:px-6 py-4 flex flex-col lg:grid lg:grid-cols-12 gap-6">
          
          {/* TIMER VIEW (Left Panel on Desktop, conditional on Mobile) */}
          <div className={`lg:col-span-5 lg:flex lg:flex-col lg:justify-center p-6 gap-8 bg-black/25 dark:bg-white/[0.01] border border-white/5 rounded-3xl lg:h-[calc(100vh-10rem)] shadow-lg backdrop-blur-xl ${
            sessionTab === 'timer' ? 'flex flex-col flex-1 items-center justify-center min-h-[350px]' : 'hidden'
          }`}>
            <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
              {/* Circular Timer Display */}
              <div className="py-9 px-10 rounded-3xl bg-black/25 dark:bg-white/[0.02] border border-white/5 backdrop-blur-xl flex flex-col items-center justify-center relative min-w-[240px] shadow-lg">
                <svg className="absolute inset-0 w-full h-full p-2.5 pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="1.5" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="46" 
                    fill="transparent" 
                    stroke="rgba(245, 158, 11, 0.4)" 
                    strokeWidth="2.5" 
                    strokeDasharray="289"
                    strokeDashoffset={289 - (289 * progressPercent) / 100}
                    className="transition-all duration-1000 origin-center -rotate-90"
                  />
                </svg>

                <span className="text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {displayIsNoTimer ? formatTime(elapsedSeconds) : formatTime(Math.max(0, (displayDurationMinutes * 60) - elapsedSeconds))}
                </span>
              </div>

              {/* Play/Pause Controls (Host) or Status Bar (Participants) */}
              <div className="w-full max-w-xs">
                {isHost ? (
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={handleToggleTimer}
                      className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md h-12 border-none ${
                        isActive 
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                          : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
                      }`}
                    >
                      {isActive ? <Pause className="h-5 w-5 shrink-0" /> : <Play className="h-5 w-5 shrink-0" />}
                      <span>{isActive ? 'pause' : 'resume'}</span>
                    </button>

                    <button
                      onClick={handleManualEndSession}
                      className="flex-1 py-3.5 rounded-2xl bg-emerald-550/15 border border-emerald-550/30 hover:bg-emerald-550/20 text-emerald-400 text-xs font-black uppercase tracking-wider transition-all cursor-pointer h-12 border-none"
                    >
                      end session
                    </button>
                  </div>
                ) : (
                  <div className="w-full py-3.5 rounded-2xl bg-black/20 dark:bg-white/[0.02] border border-white/5 text-gray-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 h-12">
                    <span className={`h-2.5 w-2.5 rounded-full bg-emerald-500 ${isActive ? 'animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}`} />
                    <span>{isActive ? 'focusing with crew' : 'session paused by host'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CHAT & CREW TABS VIEW (Right Panel on Desktop, conditional on Mobile) */}
          <div className={`lg:col-span-7 lg:flex lg:flex-col bg-black/25 dark:bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden lg:h-[calc(100vh-10rem)] shadow-lg backdrop-blur-xl ${
            sessionTab !== 'timer' ? 'flex flex-col flex-1' : 'hidden'
          }`}>
            
            {/* Sidebar Tab Selector (Desktop only) */}
            <div className="hidden lg:flex border-b border-white/5 h-11 bg-black/20 select-none">
              <button
                onClick={() => setSessionTab('chat')}
                className={`flex-1 flex items-center justify-center text-xs font-black lowercase transition-all cursor-pointer border-none bg-transparent ${
                  activeSidebarTab === 'chat'
                    ? 'border-b-2 border-amber-500 text-amber-500 font-bold'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                lounge chat
              </button>
              <button
                onClick={() => setSessionTab('crew')}
                className={`flex-1 flex items-center justify-center text-xs font-black lowercase transition-all cursor-pointer border-none bg-transparent ${
                  activeSidebarTab === 'crew'
                    ? 'border-b-2 border-amber-500 text-amber-500 font-bold'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                active cabin crew ({mappedCrew.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              
              {/* CHAT VIEW */}
              {activeSidebarTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 h-full">
                  
                  {/* Chat Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin">
                    {comments.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                        <BookText className="h-8 w-8 text-gray-500/40" />
                        <p className="text-xs text-gray-400 lowercase font-semibold">chat is currently empty.</p>
                        <p className="text-[10px] text-gray-500 lowercase leading-relaxed font-semibold">start the discussion here.</p>
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isMe = comment.user_id === activeProfile?.id
                        const av = AVATAR_MAP[comment.profiles?.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']

                        return (
                          <div key={comment.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                            <div className="relative shrink-0 mt-0.5">
                              <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${av.gradient} flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}>
                                {av.symbol}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div className={`flex items-center gap-1.5 text-[9px] text-gray-400 font-bold ${isMe ? 'justify-end' : ''}`}>
                                <span>{comment.profiles?.username || 'explorer'}</span>
                                <span>•</span>
                                <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border ${
                                isMe 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-gray-200 rounded-tr-none' 
                                  : 'bg-black/25 border-white/5 text-gray-200 rounded-tl-none'
                              }`}>
                                {comment.message}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Bar */}
                  <form onSubmit={handlePostComment} className="p-3 bg-black/20 border-t border-white/5 shrink-0">
                    <div className="flex gap-2 relative">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value.slice(0, 300))}
                        placeholder="send a message to crew..."
                        disabled={isSendingComment}
                        className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-all font-semibold h-10"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim() || isSendingComment}
                        className="w-10 h-10 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 shrink-0 border-none"
                        style={{ minHeight: '40px', minWidth: '40px' }}
                      >
                        <Send className="h-4 w-4 fill-white" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* CREW VIEW */}
              {activeSidebarTab === 'crew' && (
                <div className="flex-1 p-6 space-y-3 overflow-y-auto scrollbar-thin">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 lg:hidden">active cabin crew</h4>
                  <div className="space-y-2.5">
                    {mappedCrew.map((m) => {
                      const av = AVATAR_MAP[m.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']
                      let trafficLightColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      if (m.computedStatus === 'ready') {
                        trafficLightColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      } else if (m.computedStatus === 'joined') {
                        trafficLightColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      }

                      return (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-black/25 border border-white/5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${av.gradient} flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-sm`}>
                              {av.symbol}
                            </div>
                            <span className="text-xs font-semibold text-gray-200 truncate lowercase">
                              {m.username}
                              {m.is_host && <span className="ml-1.5 text-[7px] font-extrabold uppercase text-amber-400 tracking-wide bg-amber-500/10 px-1 rounded">host</span>}
                              {m.is_pending && <span className="ml-1.5 text-[7px] font-extrabold uppercase text-gray-400 tracking-wide bg-white/5 px-1 rounded">invited</span>}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[9px] font-bold text-gray-400 lowercase">
                              {m.is_pending ? 'invited' : m.computedStatus}
                            </span>
                            <div className={`h-2.5 w-2.5 rounded-full ${trafficLightColor}`} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Tab Navigation Bar (Bottom) */}
        <footer className="relative z-10 shrink-0 h-16 border-t border-white/5 bg-black/10 dark:bg-black/25 flex items-center justify-around select-none max-w-xl mx-auto w-full lg:hidden">
          <button
            onClick={() => setSessionTab('timer')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-12 rounded-xl transition-all cursor-pointer border-none bg-transparent ${
              sessionTab === 'timer' ? 'text-amber-500 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-300'
            }`}
          >
            <Clock className="h-5 w-5 shrink-0" />
            <span className="text-[9px] font-black tracking-wide lowercase">timer</span>
          </button>
          
          <button
            onClick={() => setSessionTab('crew')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-12 rounded-xl transition-all cursor-pointer border-none bg-transparent ${
              sessionTab === 'crew' ? 'text-amber-500 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-300'
            }`}
          >
            <Users className="h-5 w-5 shrink-0" />
            <span className="text-[9px] font-black tracking-wide lowercase">crew</span>
          </button>
          
          <button
            onClick={() => setSessionTab('chat')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-12 rounded-xl transition-all cursor-pointer border-none bg-transparent ${
              sessionTab === 'chat' ? 'text-amber-500 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-300'
            }`}
          >
            <Send className="h-5 w-5 shrink-0" />
            <span className="text-[9px] font-black tracking-wide lowercase">chat</span>
          </button>
        </footer>

        {/* REFLECTION CATALOGING MODAL OVERLAY */}
        {showCompletionModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fadeIn select-none">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            <div className="relative w-full max-w-sm bg-[#fdfbf7] dark:bg-[#12141a] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-2xl z-10 animate-scaleIn">
              <h3 className="text-sm font-black text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-2.5">
                reflect & catalog focus cycle
              </h3>

              <div className="space-y-3.5 mt-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <div className="space-y-1">
                  <label className="text-gray-400 block text-[10px] uppercase font-bold tracking-wide pl-0.5">what did you accomplish?</label>
                  <input
                    type="text"
                    required
                    value={accomplishments}
                    onChange={(e) => setAccomplishments(e.target.value)}
                    placeholder="e.g. read study papers, completed task updates..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl px-3.5 py-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 h-11"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-gray-400 text-[10px] uppercase font-bold tracking-wide pl-0.5">
                    <label>focus intensity rating</label>
                    <span className="text-amber-500 font-black text-xs">{reflectionRating}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={reflectionRating}
                    onChange={(e) => setReflectionRating(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 block text-[10px] uppercase font-bold tracking-wide pl-0.5">general notes & thoughts</label>
                  <textarea
                    value={reflections}
                    onChange={(e) => setReflections(e.target.value)}
                    placeholder="any roadblocks or achievements during this cycle..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl p-3 text-xs text-gray-805 dark:text-white focus:outline-none focus:border-amber-500/50 resize-none h-16 leading-relaxed"
                  />
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2 h-12">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleAbandonSession}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-405 rounded-xl cursor-pointer disabled:opacity-50 text-xs font-bold border-none"
                  >
                    discard
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || !accomplishments.trim()}
                    onClick={handleSaveCompletion}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold border-none"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{isSubmitting ? 'saving...' : 'save cycle'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden w-full h-[100dvh] bg-neo-bg select-none">
      
      {/* Dynamic Header */}
      <header className="relative z-10 flex items-center justify-between px-4 h-14 shrink-0 shadow-neo bg-neo-bg border-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/focus')}
            className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-all cursor-pointer"
            title="Return to Study Lounge"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-900 dark:text-white lowercase truncate leading-none mt-0.5">
              {room.name}
            </h2>
            <span className="text-[10px] text-gray-400 font-semibold lowercase">
              host: {hostProfile?.username || 'explorer'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost ? (
            <button
              onClick={handleCompleteRoom}
              className="px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-black transition-all cursor-pointer h-9 lowercase"
            >
              complete session
            </button>
          ) : (
            <button
              onClick={handleLeaveRoom}
              className="px-3.5 rounded-xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-black transition-all cursor-pointer h-9 lowercase"
            >
              leave
            </button>
          )}
        </div>
      </header>

      {/* Responsive Grid Layout Body */}
      <div className="flex-1 overflow-y-auto min-h-0 w-full px-4 py-4 scrollbar-thin">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          
          {/* Setup Panel (Left/Top) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* Waiting Room style preview card */}
        <div className="bg-white dark:bg-[#18181f] border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-neo flex flex-col items-center justify-center gap-4 relative">
          
          {/* Avatar Preview */}
          <div className="relative">
            <div className={`h-24 w-24 rounded-full bg-gradient-to-tr ${AVATAR_MAP[activeProfile?.avatar || 'avatar-cyber-ghost']?.gradient || AVATAR_MAP['avatar-cyber-ghost'].gradient} flex items-center justify-center text-2xl font-bold text-white shadow-md border-4 border-white dark:border-[#18181f]`}>
              {AVATAR_MAP[activeProfile?.avatar || 'avatar-cyber-ghost']?.symbol || AVATAR_MAP['avatar-cyber-ghost'].symbol}
            </div>
            <span className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full border-2 border-white dark:border-[#18181f] bg-emerald-500 shadow-md" />
          </div>

          <div className="text-center">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase">
              {!isHost && myMemberRecord?.status === 'ready' ? 'you are ready to focus!' : `ready to focus, ${activeProfile?.username}?`}
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-1">
              goal: <span className="text-amber-500 font-black">{selectedGoal}</span> • theme: <span className="text-amber-500 font-black">{currentThemeConfig.name}</span>
            </p>
          </div>

          {!isHost && myMemberRecord?.status === 'ready' ? (
            <div className="flex flex-col items-center justify-center p-6 bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/25 rounded-2xl w-full gap-3 my-2 shadow-sm animate-pulse">
              <div className="relative flex items-center justify-center">
                <svg className="animate-spin h-10 w-10 text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 3 22 21 2 21" />
                </svg>
              </div>
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 tracking-wider lowercase">
                room is starting...
              </p>
            </div>
          ) : (
            <>
              {/* Goal, Duration & Theme Quick Settings */}
              <div className="w-full grid grid-cols-2 gap-2 mt-2">
                
                {/* Goal Select */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-0.5">focus goal</span>
                  <select
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(e.target.value)}
                    className="w-full bg-[#faf8f5] dark:bg-[#15171d] border border-black/5 dark:border-white/5 rounded-xl px-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 font-semibold h-10 lowercase"
                  >
                    {GOAL_OPTIONS.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Duration Select */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-0.5">duration</span>
                  <select
                    value={isNoTimer ? 'stopwatch' : durationMinutes}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'stopwatch') {
                        setIsNoTimer(true);
                        setDurationMinutes(0);
                      } else {
                        setIsNoTimer(false);
                        setDurationMinutes(parseInt(val));
                      }
                    }}
                    className="w-full bg-[#faf8f5] dark:bg-[#15171d] border border-black/5 dark:border-white/5 rounded-xl px-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 font-semibold h-10 lowercase"
                  >
                    <option value={25}>25m (pomodoro)</option>
                    <option value={50}>50m</option>
                    <option value={5}>5m (short break)</option>
                    <option value={15}>15m</option>
                    <option value="stopwatch">stopwatch</option>
                  </select>
                </div>

              </div>

              <div className="w-full flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-0.5">theme atmosphere</span>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="w-full bg-[#faf8f5] dark:bg-[#15171d] border border-black/5 dark:border-white/5 rounded-xl px-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 font-semibold h-10 lowercase"
                >
                  {AMBIENT_THEMES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Action Button */}
          <div className="w-full mt-2">
            {isHost ? (
              <div className="space-y-2">
                <button
                  disabled={isStarting}
                  onClick={handleStartSession}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md cursor-pointer transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 h-11 border-none lowercase font-semibold"
                >
                  <Play className="h-4.5 w-4.5 fill-white shrink-0" />
                  <span>{isStarting ? 'starting...' : 'start focus cabin'}</span>
                </button>
                {!canStartSession && (
                  <p className="text-[9px] text-center font-bold text-amber-600 dark:text-amber-550/70 lowercase leading-none">
                    waiting for everyone to be ready...
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleToggleReady}
                className={`w-full py-3.5 rounded-xl text-white text-xs font-black shadow-md cursor-pointer transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-1.5 h-11 border-none lowercase font-semibold ${
                  myMemberRecord?.status === 'ready'
                    ? 'bg-emerald-550 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                <Check className="h-4.5 w-4.5 shrink-0" />
                <span>{myMemberRecord?.status === 'ready' ? 'cancel ready status' : 'i\'m ready'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Crew status strip */}
        <div className="flex justify-between items-center px-2 py-1 lg:hidden">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            readiness status
          </span>
          <span className="text-[10px] font-black text-amber-500 lowercase bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            {readyCount}/{totalCount} members ready
          </span>
        </div>

          </div>

          {/* Chat & Crew Tabs Panel (Right/Bottom) */}
          <div className="lg:col-span-7 flex flex-col min-h-[450px] lg:h-[calc(100vh-6.5rem)] bg-white/40 dark:bg-black/10 border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden mb-6">
          
          {/* Tab Selector */}
          <div className="flex border-b border-black/5 dark:border-white/5 h-11 bg-[#faf8f5]/60 dark:bg-[#15171d]/60 select-none">
            <button
              onClick={() => setLobbyTab('chat')}
              className={`flex-1 flex items-center justify-center text-xs font-black lowercase transition-all cursor-pointer ${
                lobbyTab === 'chat'
                  ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-500 font-bold'
                  : 'text-gray-450 dark:text-gray-500 hover:text-gray-700'
              }`}
            >
              lounge chat
            </button>
            <button
              onClick={() => setLobbyTab('crew')}
              className={`flex-1 flex items-center justify-center text-xs font-black lowercase transition-all cursor-pointer ${
                lobbyTab === 'crew'
                  ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-500 font-bold'
                  : 'text-gray-450 dark:text-gray-500 hover:text-gray-700'
              }`}
            >
              cabin crew ({mappedCrew.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            
            {/* Chat Content */}
            {lobbyTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 h-full">
                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin">
                  {comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                      <BookText className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                      <p className="text-xs text-gray-400 lowercase font-semibold">chat feed is empty.</p>
                      <p className="text-[10px] text-gray-500 lowercase leading-relaxed font-semibold">write a check-in message to start talking.</p>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const isMe = comment.user_id === activeProfile?.id
                      const av = AVATAR_MAP[comment.profiles?.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']

                      return (
                        <div key={comment.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                          <div className="relative shrink-0 mt-0.5">
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${av.gradient} flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}>
                              {av.symbol}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <div className={`flex items-center gap-1.5 text-[9px] text-gray-400 font-bold ${isMe ? 'justify-end' : ''}`}>
                              <span>{comment.profiles?.username || 'explorer'}</span>
                              <span>•</span>
                              <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border ${
                              isMe 
                                ? 'bg-amber-500/10 border-amber-500/20 text-gray-800 dark:text-amber-200 rounded-tr-none' 
                                : 'bg-white dark:bg-[#18181f] border-black/5 dark:border-white/5 text-gray-750 dark:text-gray-250 rounded-tl-none'
                            }`}>
                              {comment.message}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handlePostComment} className="p-3 bg-white/40 dark:bg-black/20 border-t border-black/5 dark:border-white/[0.05] shrink-0">
                  <div className="flex gap-2 relative">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value.slice(0, 300))}
                      placeholder="type a lounge message..."
                      disabled={isSendingComment}
                      className="flex-1 bg-white dark:bg-[#15171d] border border-black/8 dark:border-white/8 rounded-xl px-4 text-xs text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 transition-all font-semibold h-10"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSendingComment}
                      className="w-10 h-10 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 shrink-0 border-none"
                      style={{ minHeight: '40px', minWidth: '40px' }}
                    >
                      <Send className="h-4 w-4 fill-white" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Crew Content */}
            {lobbyTab === 'crew' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0 scrollbar-thin">
                {mappedCrew.map((m) => {
                  const av = AVATAR_MAP[m.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']
                  let trafficLightColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  if (m.computedStatus === 'ready') {
                    trafficLightColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  } else if (m.computedStatus === 'joined') {
                    trafficLightColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  }

                  return (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#18181f]/80 border border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-6.5 w-6.5 rounded-full bg-gradient-to-br ${av.gradient} flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm`}>
                          {av.symbol}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate lowercase">
                          {m.username}
                          {m.is_host && <span className="ml-1.5 text-[7px] font-extrabold uppercase text-amber-500 tracking-wide bg-amber-500/10 px-1 rounded">host</span>}
                          {m.is_pending && <span className="ml-1.5 text-[7px] font-extrabold uppercase text-gray-400 tracking-wide bg-black/5 dark:bg-white/5 px-1 rounded">invited</span>}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 lowercase">
                          {m.is_pending ? 'invited' : m.computedStatus}
                        </span>
                        <div className={`h-2.5 w-2.5 rounded-full ${trafficLightColor}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>

  </div>
  )
}
