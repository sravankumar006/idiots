'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Clock,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  Code,
  Briefcase,
  Layers,
  ChevronDown,
  Award,
  GraduationCap,
  Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

// Define focus categories with matching icons
const CATEGORIES = [
  { id: 'Academics', label: 'Academics', icon: GraduationCap, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'Coding', label: 'Coding', icon: Code, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'Project', label: 'Project', icon: Briefcase, color: 'text-cyan-500 bg-cyan-500/10' },
  { id: 'Reading', label: 'Reading', icon: BookOpen, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'Other', label: 'Other', icon: Layers, color: 'text-gray-500 bg-gray-500/10' }
]

const PRESETS = [25, 45, 60, 90]

export default function ZenFocusPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Auth and profile states
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Navigation states
  const [isSessionOpen, setIsSessionOpen] = useState(false)

  // Form states
  const [sessionTitle, setSessionTitle] = useState('')
  const [category, setCategory] = useState('Coding')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  // Timer states
  const [durationMinutes, setDurationMinutes] = useState(25)
  const [customMinutes, setCustomMinutes] = useState('')
  const [isCustomDuration, setIsCustomDuration] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle')
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(25 * 60)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Telemetry tracking states
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [pauseCount, setPauseCount] = useState(0)

  // Stats states (persisted in localStorage / DB)
  const [todayFocusTime, setTodayFocusTime] = useState(0) // in seconds
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper to save active timer state to localStorage (enables state recovery on refresh/standby)
  const saveActiveTimerState = (
    status: string,
    time: number,
    elapsed: number,
    pauses: number,
    start: string | null,
    profileId: string
  ) => {
    const stateObj = {
      isSessionOpen: true,
      sessionTitle,
      category,
      durationMinutes,
      customMinutes,
      isCustomDuration,
      timeLeft: time,
      timerStatus: status,
      elapsedSeconds: elapsed,
      pauseCount: pauses,
      startedAt: start,
      lastTickTime: Date.now()
    }
    localStorage.setItem(`zen_focus_active_timer_${profileId}`, JSON.stringify(stateObj))
  }

  // Load profile session and restore timer states
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
            
          if (prof) {
            const userProfile = prof as UserProfile
            setActiveProfile(userProfile)
            
            // 1. Fetch today's focus stats from DB / fallback local
            await fetchTodayStats(userProfile.id)

            // 2. Restore active timer state if present
            const saved = localStorage.getItem(`zen_focus_active_timer_${userProfile.id}`)
            if (saved) {
              try {
                const state = JSON.parse(saved)
                setIsSessionOpen(state.isSessionOpen || false)
                setSessionTitle(state.sessionTitle || '')
                setCategory(state.category || 'Coding')
                setDurationMinutes(state.durationMinutes || 25)
                setCustomMinutes(state.customMinutes || '')
                setIsCustomDuration(state.isCustomDuration || false)
                setPauseCount(state.pauseCount || 0)
                setStartedAt(state.startedAt || null)
                
                const totalSecs = state.isCustomDuration 
                  ? (Number(state.customMinutes) || 0) * 60 
                  : state.durationMinutes * 60
                setTotalSessionSeconds(totalSecs)

                if (state.timerStatus === 'running') {
                  const now = Date.now()
                  const timePassed = Math.floor((now - state.lastTickTime) / 1000)
                  const newTimeLeft = Math.max(0, state.timeLeft - timePassed)
                  
                  if (newTimeLeft <= 0) {
                    // Timer finished while offline/away. Auto-complete and save record.
                    setTimeLeft(0)
                    setElapsedSeconds(totalSecs)
                    setTimerStatus('completed')
                    const endedTime = new Date(state.lastTickTime + state.timeLeft * 1000).toISOString()
                    
                    supabase.from('focus_sessions').insert({
                      user_id: userProfile.id,
                      title: state.sessionTitle || 'Zen Focus Session',
                      goal: state.sessionTitle || 'Zen Focus Session',
                      category: state.category,
                      started_at: state.startedAt,
                      ended_at: endedTime,
                      duration_minutes: state.isCustomDuration ? (Number(state.customMinutes) || 0) : state.durationMinutes,
                      actual_minutes: Math.max(1, Math.round(totalSecs / 60)),
                      completed: true,
                      pause_count: state.pauseCount,
                      created_at: state.startedAt
                    }).then(() => {
                      fetchTodayStats(userProfile.id)
                    })

                    localStorage.removeItem(`zen_focus_active_timer_${userProfile.id}`)
                  } else {
                    setTimeLeft(newTimeLeft)
                    setElapsedSeconds(totalSecs - newTimeLeft)
                    setTimerStatus('running')
                  }
                } else if (state.timerStatus === 'paused') {
                  setTimeLeft(state.timeLeft)
                  setElapsedSeconds(state.elapsedSeconds)
                  setTimerStatus('paused')
                } else if (state.timerStatus === 'completed') {
                  setTimeLeft(0)
                  setElapsedSeconds(state.elapsedSeconds)
                  setTimerStatus('completed')
                }
              } catch (e) {
                console.warn("Failed to parse saved active timer state:", e)
              }
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization failed:", err)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    getSession()
  }, [supabase])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Synchronize initial time left with duration selection
  useEffect(() => {
    if (timerStatus === 'idle') {
      if (isCustomDuration) {
        const mins = Number(customMinutes) || 0
        setTimeLeft(mins * 60)
        setTotalSessionSeconds(mins * 60)
      } else {
        setTimeLeft(durationMinutes * 60)
        setTotalSessionSeconds(durationMinutes * 60)
      }
      setElapsedSeconds(0)
    }
  }, [durationMinutes, customMinutes, isCustomDuration, timerStatus])

  // Play completion chimes tone
  const playCompletionChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(frequency, startTime)
        
        gainNode.gain.setValueAtTime(0.15, startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
        
        osc.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      
      playTone(523.25, audioCtx.currentTime, 1.2) // C5
      playTone(659.25, audioCtx.currentTime + 0.15, 1.5) // E5
    } catch (e) {
      console.warn("Chime playback blocked or not supported:", e)
    }
  }

  // Fetch today's accumulated focus metrics
  const fetchTodayStats = async (uid: string) => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('actual_minutes, completed')
        .eq('user_id', uid)
        .gte('created_at', todayStart.toISOString())
      
      if (error) throw error
      
      if (data) {
        const totalSecs = data.reduce((acc, s) => acc + (s.actual_minutes * 60), 0)
        const completedCount = data.filter(s => s.completed).length
        setTodayFocusTime(totalSecs)
        setSessionsCompleted(completedCount)
        
        // Save to local storage for offline/fallback caching
        const todayStr = new Date().toISOString().split('T')[0]
        localStorage.setItem('zen_focus_date_key', todayStr)
        localStorage.setItem('zen_focus_today_time', String(totalSecs))
        localStorage.setItem('zen_focus_today_sessions', String(completedCount))
      }
    } catch (e) {
      console.warn("Failed to fetch today's stats from DB, falling back to local storage:", e)
      const todayStr = new Date().toISOString().split('T')[0]
      const storedDate = localStorage.getItem('zen_focus_date_key')
      
      if (storedDate === todayStr) {
        setTodayFocusTime(Number(localStorage.getItem('zen_focus_today_time') || '0'))
        setSessionsCompleted(Number(localStorage.getItem('zen_focus_today_sessions') || '0'))
      } else {
        setTodayFocusTime(0)
        setSessionsCompleted(0)
      }
    }
  }

  // Main timer ticking mechanism
  useEffect(() => {
    if (timerStatus === 'running' && activeProfile) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            endFocusSession(true)
            return 0
          }
          const nextTime = prev - 1
          const elapsed = totalSessionSeconds - nextTime
          setElapsedSeconds(elapsed)
          // Tick-by-tick state persistence to avoid losing time on refresh/close
          saveActiveTimerState('running', nextTime, elapsed, pauseCount, startedAt, activeProfile.id)
          return nextTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerStatus, totalSessionSeconds, activeProfile, startedAt, pauseCount])

  /* ========================================================
     TELEMETRY STATE MANAGEMENT HELPERS
     ======================================================== */

  // Helper 1: Start Focus Session
  const startFocusSession = () => {
    const totalSecs = isCustomDuration 
      ? (Number(customMinutes) || 0) * 60 
      : durationMinutes * 60
    
    if (totalSecs <= 0) return
    
    const startTime = new Date().toISOString()
    setStartedAt(startTime)
    setPauseCount(0)
    setTimeLeft(totalSecs)
    setTotalSessionSeconds(totalSecs)
    setElapsedSeconds(0)
    setTimerStatus('running')
    
    if (activeProfile) {
      saveActiveTimerState('running', totalSecs, 0, 0, startTime, activeProfile.id)
    }
  }

  // Helper 2: Pause Focus Session
  const pauseFocusSession = () => {
    setTimerStatus('paused')
    const nextPauseCount = pauseCount + 1
    setPauseCount(nextPauseCount)
    
    if (activeProfile) {
      saveActiveTimerState('paused', timeLeft, elapsedSeconds, nextPauseCount, startedAt, activeProfile.id)
    }
  }

  // Helper 3: Resume Focus Session
  const resumeFocusSession = () => {
    setTimerStatus('running')
    
    if (activeProfile) {
      saveActiveTimerState('running', timeLeft, elapsedSeconds, pauseCount, startedAt, activeProfile.id)
    }
  }

  // Helper 4: End Focus Session (completed = true/false)
  const endFocusSession = async (completed: boolean) => {
    if (!activeProfile) return

    let finalElapsedSeconds = elapsedSeconds
    let finalCompleted = completed

    if (completed) {
      finalElapsedSeconds = totalSessionSeconds
      playCompletionChime()
    } else {
      finalElapsedSeconds = totalSessionSeconds - timeLeft
    }

    const endTime = new Date().toISOString()
    const sessionStartTime = startedAt || new Date(Date.now() - finalElapsedSeconds * 1000).toISOString()
    
    // Telemetry payload matching database schema requirement
    const payload = {
      user_id: activeProfile.id,
      title: sessionTitle.trim() || 'Zen Focus Session',
      goal: sessionTitle.trim() || 'Zen Focus Session', // study cabins compatibility
      category: category,
      started_at: sessionStartTime,
      ended_at: endTime,
      duration_minutes: isCustomDuration ? (Number(customMinutes) || 0) : durationMinutes,
      actual_minutes: Math.max(1, Math.round(finalElapsedSeconds / 60)),
      completed: finalCompleted,
      pause_count: pauseCount,
      created_at: sessionStartTime
    }

    // Insert telemetry details into Supabase
    try {
      const { error } = await supabase
        .from('focus_sessions')
        .insert(payload)
      
      if (error) throw error
    } catch (err) {
      console.error("Failed to insert telemetry focus session:", err)
      // Save locally as offline fallback
      try {
        const historyKey = `mock_focus_sessions_${activeProfile.id}`
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
        history.unshift({
          id: `fs-fallback-${Date.now()}`,
          ...payload
        })
        localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 100)))
      } catch (e) {
        console.warn("Failed to write offline fallback session:", e)
      }
    }

    // Clear saved active timer states
    localStorage.removeItem(`zen_focus_active_timer_${activeProfile.id}`)

    // Update screen state
    setTimerStatus(completed ? 'completed' : 'idle')
    setStartedAt(null)
    setPauseCount(0)
    
    if (!completed) {
      setSessionTitle('')
      if (isCustomDuration) {
        const mins = Number(customMinutes) || 0
        setTimeLeft(mins * 60)
      } else {
        setTimeLeft(durationMinutes * 60)
      }
      setElapsedSeconds(0)
    }

    // Refresh today's stats values
    await fetchTodayStats(activeProfile.id)
  }

  // Wrapper for manual early session termination
  const handleEndSessionEarly = () => {
    if (window.confirm("Are you sure you want to end this focus session early? We will save your elapsed focus time.")) {
      endFocusSession(false)
    }
  }

  const resetToSetup = () => {
    setTimerStatus('idle')
    setSessionTitle('')
    if (isCustomDuration) {
      const mins = Number(customMinutes) || 0
      setTimeLeft(mins * 60)
    } else {
      setTimeLeft(durationMinutes * 60)
    }
    setElapsedSeconds(0)
  }

  // Formatting helpers
  const formatClockTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatHoursAndMinutes = (totalSecs: number) => {
    const totalMinutes = Math.floor(totalSecs / 60)
    if (totalMinutes === 0) return '0 minutes'
    const hrs = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60

    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    }
    return `${mins} minutes`
  }

  // Radial progress calculations
  const radius = 110
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = totalSessionSeconds > 0
    ? circumference * (1 - timeLeft / totalSessionSeconds)
    : 0

  const activeCategory = CATEGORIES.find(c => c.id === category) || CATEGORIES[1]
  const ActiveCategoryIcon = activeCategory.icon

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-500 lowercase">establishing secure growth node...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0e14] text-gray-200 font-sans flex flex-col items-center relative overflow-hidden px-4 py-8 select-none">
      
      {/* Background glow node elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 dark:bg-violet-900/5 rounded-full blur-3xl pointer-events-none animate-breathing" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 dark:bg-cyan-900/5 rounded-full blur-3xl pointer-events-none animate-breathing" style={{ animationDelay: '3s' }} />

      {/* Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between z-20 mb-8 pt-safe">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-violet-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neo-secondary">
            zen focus solo deck
          </span>
        </div>
        <Link href="/dashboard" className="touch-target h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200">
          <X className="h-5 w-5" />
        </Link>
      </div>

      {!isSessionOpen ? (
        /* ========================================================
           LOBBY VIEW (Intro Card with description & enter button)
           ======================================================== */
        <div className="w-full max-w-md my-auto flex flex-col justify-center items-center z-10 animate-pageFadeIn">
          <div className="bg-neo-bg shadow-neo border border-white/5 p-8 rounded-[28px] w-full text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 mx-auto">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-white lowercase">solo focus environment</h1>
              <p className="text-xs text-neo-secondary font-medium leading-relaxed">
                Welcome to Zen Focus, a completely private study space. Social feeds, team chats, notifications, and updates are entirely hidden to protect your deep concentration and keep you locked in a state of high flow.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSessionOpen(true)}
                className="w-full py-4 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:translate-y-0.5 shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Open Solo Session</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
           ACTIVE TIMER DECK VIEW
           ======================================================== */
        <div className="w-full max-w-md flex-1 flex flex-col justify-between z-10 animate-pageFadeIn">
          
          {/* Top Section: Inputs */}
          <div className="space-y-4">
            {/* Session Title Input */}
            <div className="w-full">
              <input
                type="text"
                disabled={timerStatus !== 'idle'}
                placeholder="What are you focusing on?"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="glass-input w-full rounded-2xl py-3.5 px-4 text-xs font-semibold placeholder:text-gray-500 disabled:opacity-50 text-white focus:outline-none"
              />
            </div>

            {/* Category Dropdown Selection */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                disabled={timerStatus !== 'idle'}
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-left text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-between disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeCategory.color}`}>
                    <ActiveCategoryIcon className="h-3.5 w-3.5" />
                  </div>
                  <span>{activeCategory.label}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#181922] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-30 animate-fadeIn">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon
                    const isSelected = category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id)
                          setIsCategoryDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-xs font-semibold flex items-center justify-between hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${cat.color}`}>
                            <CatIcon className="h-3.5 w-3.5" />
                          </div>
                          <span>{cat.label}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-violet-500" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Center Section: Timer */}
          <div className="flex flex-col items-center justify-center py-6 relative my-auto">
            {/* Circular Countdown Ring */}
            <div className="relative flex items-center justify-center">
              <svg width="240" height="240" className="transform -rotate-90">
                {/* Background track circle */}
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke="#1c1d26"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Active progress ring */}
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke={
                    timerStatus === 'completed'
                      ? 'var(--accent-cool)'
                      : timerStatus === 'paused'
                      ? 'var(--accent-warm)'
                      : 'var(--neo-purple)'
                  }
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Timer clock inside circle */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold font-mono text-white tracking-wider">
                  {formatClockTime(timeLeft)}
                </span>
                <span className="text-[10px] text-neo-secondary font-black uppercase tracking-widest mt-1">
                  {timerStatus}
                </span>
              </div>
            </div>

            {/* Presets and Custom Inputs */}
            <div className="w-full mt-6 space-y-4">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {PRESETS.map((preset) => {
                  const isSelected = !isCustomDuration && durationMinutes === preset
                  return (
                    <button
                      key={preset}
                      disabled={timerStatus !== 'idle'}
                      onClick={() => {
                        setIsCustomDuration(false)
                        setDurationMinutes(preset)
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50'
                      }`}
                    >
                      {preset}m
                    </button>
                  )
                })}
                <button
                  disabled={timerStatus !== 'idle'}
                  onClick={() => setIsCustomDuration(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isCustomDuration
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom Duration Input */}
              {isCustomDuration && timerStatus === 'idle' && (
                <div className="flex items-center gap-2 w-full max-w-[200px] mx-auto animate-fadeIn">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="Mins"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="glass-input text-center rounded-xl py-2 px-3 text-xs font-bold w-full text-white placeholder:text-gray-600 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500 font-bold">mins</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full pb-6">
            {timerStatus === 'idle' && (
              <button
                onClick={startFocusSession}
                disabled={timeLeft <= 0}
                className="w-full py-4 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:translate-y-0.5 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Start Focus Session</span>
              </button>
            )}

            {timerStatus === 'running' && (
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={pauseFocusSession}
                  className="py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Pause className="h-4 w-4 fill-white" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={handleEndSessionEarly}
                  className="py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>End Session</span>
                </button>
              </div>
            )}

            {timerStatus === 'paused' && (
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={resumeFocusSession}
                  className="py-4 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={handleEndSessionEarly}
                  className="py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>End Session</span>
                </button>
              </div>
            )}

            {timerStatus === 'completed' && (
              <div className="space-y-3 w-full">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white lowercase">session accomplished</h4>
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      Excellent focus! Today&apos;s records have been synchronization updated.
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetToSetup}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:translate-y-0.5 shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>New Focus Session</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Section: Stats */}
          <div className="grid grid-cols-2 gap-3.5 z-10 pt-4 border-t border-white/5 w-full">
            <div className="bg-neo-bg shadow-neo-inset-shallow p-4 rounded-2xl text-center flex flex-col justify-center">
              <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-widest block mb-1">
                Today&apos;s Focus
              </span>
              <span className="text-sm font-bold text-white">
                {formatHoursAndMinutes(todayFocusTime)}
              </span>
            </div>
            <div className="bg-neo-bg shadow-neo-inset-shallow p-4 rounded-2xl text-center flex flex-col justify-center">
              <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-widest block mb-1">
                Completed Today
              </span>
              <span className="text-sm font-bold text-white">
                {sessionsCompleted} {sessionsCompleted === 1 ? 'session' : 'sessions'}
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
