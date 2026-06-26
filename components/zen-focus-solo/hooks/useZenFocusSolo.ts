import { useState, useEffect, useRef } from 'react'
import { UserProfile } from '@/types'
import { TimerStatus } from '../types/zen-focus-solo.types'
import { getTodayFocusSessions, insertFocusSession, getActiveUserProfile } from '../services/zen-focus-solo.service'

export function useZenFocusSolo() {
  
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
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle')
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
      const res = await getTodayFocusSessions(uid)
      
      if (res.success && res.data) {
        const totalSecs = res.data.reduce((acc: number, s: any) => acc + (s.actual_minutes * 60), 0)
        const completedCount = res.data.filter((s: any) => s.completed).length
        setTodayFocusTime(totalSecs)
        setSessionsCompleted(completedCount)
        
        // Save to local storage for offline/fallback caching
        const todayStr = new Date().toISOString().split('T')[0]
        localStorage.setItem('zen_focus_date_key', todayStr)
        localStorage.setItem('zen_focus_today_time', String(totalSecs))
        localStorage.setItem('zen_focus_today_sessions', String(completedCount))
      } else if (res.error) {
        throw res.error
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

  // Load profile session and restore timer states
  useEffect(() => {
    const getSession = async () => {
      try {
        const res = await getActiveUserProfile()
        if (res.success && res.data) {
          const userProfile = res.data
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
                    
                    const payload = {
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
                    }

                    insertFocusSession(payload).then((res) => {
                      if (res.success) {
                        fetchTodayStats(userProfile.id)
                      }
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
      } catch (err) {
        console.error("Auth initialization failed:", err)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    getSession()
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
    
    const payload = {
      user_id: activeProfile.id,
      title: sessionTitle.trim() || 'Zen Focus Session',
      goal: sessionTitle.trim() || 'Zen Focus Session',
      category: category,
      started_at: sessionStartTime,
      ended_at: endTime,
      duration_minutes: isCustomDuration ? (Number(customMinutes) || 0) : durationMinutes,
      actual_minutes: Math.max(1, Math.round(finalElapsedSeconds / 60)),
      completed: finalCompleted,
      pause_count: pauseCount,
      created_at: sessionStartTime
    }

    try {
      const res = await insertFocusSession(payload)
      if (!res.success) throw res.error
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

    localStorage.removeItem(`zen_focus_active_timer_${activeProfile.id}`)

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

  return {
    activeProfile,
    isLoadingProfile,
    isSessionOpen,
    setIsSessionOpen,
    sessionTitle,
    setSessionTitle,
    category,
    setCategory,
    isCategoryDropdownOpen,
    setIsCategoryDropdownOpen,
    durationMinutes,
    setDurationMinutes,
    customMinutes,
    setCustomMinutes,
    isCustomDuration,
    setIsCustomDuration,
    timeLeft,
    timerStatus,
    totalSessionSeconds,
    elapsedSeconds,
    startedAt,
    pauseCount,
    todayFocusTime,
    sessionsCompleted,
    dropdownRef,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    handleEndSessionEarly,
    resetToSetup
  }
}
