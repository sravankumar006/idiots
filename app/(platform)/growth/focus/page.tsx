'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, Pause, RotateCcw, Clock, ShieldCheck, Zap, Award, Flame,
  BookOpen, Code, Search, Briefcase, Sparkles, GraduationCap,
  X, ArrowLeft, BookText, Activity, Save, CheckCircle2, Heart
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

// Theme config with CSS animation classes & background colors
const AMBIENT_THEMES = [
  { id: 'minimal_zen', name: 'Minimal Zen', bg: 'bg-[#fdfbf7] dark:bg-[#121110]', textColor: 'text-amber-900 dark:text-amber-100', accent: 'amber', description: 'Soft amber glow and calming breathing pulse' },
  { id: 'rain', name: 'Rain', bg: 'bg-[#f1f5f9] dark:bg-[#0f172a]', textColor: 'text-slate-900 dark:text-slate-100', accent: 'sky', description: 'Deep slate grey with animated rain droplets' },
  { id: 'aurora', name: 'Aurora', bg: 'bg-gradient-to-tr from-teal-900 via-indigo-900 to-purple-950', textColor: 'text-emerald-100', accent: 'emerald', description: 'Shifting northern lights gradient' },
  { id: 'deep_space', name: 'Deep Space', bg: 'bg-[#030712]', textColor: 'text-gray-100', accent: 'indigo', description: 'Pitch dark cosmos with twinkling stars' },
  { id: 'coding_cave', name: 'Coding Cave', bg: 'bg-[#090b10]', textColor: 'text-emerald-400 font-mono', accent: 'emerald', description: 'Retro digital cave with glowing outlines' },
  { id: 'ocean_depth', name: 'Ocean Depth', bg: 'bg-gradient-to-b from-[#0f1b29] to-[#02060d]', textColor: 'text-cyan-200', accent: 'cyan', description: 'Deep aquatic blue waves' }
]

const GOAL_OPTIONS = [
  { id: 'Study', name: 'Study', icon: GraduationCap, color: 'text-indigo-400' },
  { id: 'Coding', name: 'Coding', icon: Code, color: 'text-emerald-400' },
  { id: 'Research', name: 'Research', icon: Search, color: 'text-cyan-400' },
  { id: 'Reading', name: 'Reading', icon: BookOpen, color: 'text-rose-400' },
  { id: 'Project Work', name: 'Project Work', icon: Briefcase, color: 'text-amber-400' },
  { id: 'Custom', name: 'Custom Goal', icon: Sparkles, color: 'text-violet-400' }
]

export default function RedesignedFocusPage() {
  const supabase = createClient()
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  
  // Historical stats
  const [focusStats, setFocusStats] = useState({
    totalHours: 0,
    totalSessions: 0,
    weeklyMinutes: 0,
    monthlyMinutes: 0
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])

  // Setup Config State
  const [selectedGoal, setSelectedGoal] = useState('Study')
  const [customGoalText, setCustomGoalText] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(25) // minutes, 0 means no timer
  const [customDurationInput, setCustomDurationInput] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('minimal_zen')
  const [isNoTimer, setIsNoTimer] = useState(false)

  // Active Focus State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [notes, setNotes] = useState('')
  const [notesSavedStatus, setNotesSavedStatus] = useState<'saved' | 'saving' | 'error'>('saved')

  // Completion State
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [accomplishments, setAccomplishments] = useState('')
  const [reflectionRating, setReflectionRating] = useState(7) // 1-10
  const [reflections, setReflections] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Fetch User Profile and Focus Stats
  const fetchUserAndStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (prof) {
          setActiveProfile(prof as UserProfile)
          
          // Fetch completed focus sessions
          const { data: sessions, error } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('completed', true)
            .order('created_at', { ascending: false })
            .limit(30)
            
          if (sessions) {
            setRecentSessions(sessions)
            
            // Compute aggregated statistics
            const totalMins = sessions.reduce((acc: number, s: any) => acc + s.actual_minutes, 0)
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
            const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
            
            let weeklyMins = 0
            let monthlyMins = 0
            
            sessions.forEach((s: any) => {
              const time = new Date(s.created_at).getTime()
              if (time >= oneWeekAgo) weeklyMins += s.actual_minutes
              if (time >= oneMonthAgo) monthlyMins += s.actual_minutes
            })
            
            setFocusStats({
              totalHours: Number((totalMins / 60).toFixed(1)),
              totalSessions: sessions.length,
              weeklyMinutes: weeklyMins,
              monthlyMinutes: monthlyMins
            })
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load stats/profile:", err)
    }
  }

  useEffect(() => {
    fetchUserAndStats()
  }, [supabase])

  // 2. Active Session Recovery
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // Find incomplete session in last 4 hours
        const { data: activeSession } = await supabase
          .from('focus_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
          
        if (activeSession) {
          const createdAtTime = new Date(activeSession.created_at).getTime()
          const nowTime = Date.now()
          const hoursDiff = (nowTime - createdAtTime) / (1000 * 60 * 60)
          
          if (hoursDiff < 4) {
            // Restore session
            setActiveSessionId(activeSession.id)
            setSelectedGoal(activeSession.goal)
            setSelectedTheme(activeSession.theme)
            setNotes(activeSession.notes)
            
            const duration = activeSession.duration_minutes || 0
            setDurationMinutes(duration)
            setIsNoTimer(duration === 0)
            
            // Set elapsed seconds to what was stored
            setElapsedSeconds(activeSession.elapsed_seconds || 0)
            setIsActive(false) // Let user manually play/pause
            setIsFullscreen(true)
          }
        }
      } catch (err) {
        console.warn("Session recovery failed:", err)
      }
    }
    recoverSession()
  }, [supabase])

  // 3. Timer Logic
  useEffect(() => {
    if (isActive && !showCompletionModal) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const nextSeconds = prev + 1
          
          // Every 10 seconds, sync notes and elapsed_seconds to DB to maintain session recovery safety
          if (nextSeconds % 10 === 0 && activeSessionId) {
            supabase.from('focus_sessions')
              .update({ elapsed_seconds: nextSeconds })
              .eq('id', activeSessionId)
              .then(() => {})
          }

          if (!isNoTimer) {
            const totalSeconds = durationMinutes * 60
            if (nextSeconds >= totalSeconds) {
              setIsActive(false)
              if (timerRef.current) clearInterval(timerRef.current)
              // Open completion flow
              setShowCompletionModal(true)
              return totalSeconds
            }
          }
          return nextSeconds
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, durationMinutes, isNoTimer, activeSessionId, showCompletionModal])

  // 4. Notes Autosave
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
        console.warn("Autosave failed, caching locally:", err)
        localStorage.setItem(`focus_notes_${activeSessionId}`, notes)
        setNotesSavedStatus('error')
      }
    }, 2000)

    return () => clearTimeout(delayDebounce)
  }, [notes, activeSessionId, elapsedSeconds])

  if (!mounted) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">establishing secure node connection...</p>
        </div>
      </PageContainer>
    )
  }

  // 5. Initiate Focus Session
  const handleStartSession = async () => {
    if (!activeProfile) return
    
    const finalGoal = selectedGoal === 'Custom' ? (customGoalText.trim() || 'My Custom Goal') : selectedGoal
    const finalDuration = isNoTimer ? 0 : durationMinutes
    
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: activeProfile.id,
          goal: finalGoal,
          duration_minutes: finalDuration === 0 ? null : finalDuration,
          actual_minutes: 0,
          elapsed_seconds: 0,
          theme: selectedTheme,
          notes: '',
          completed: false
        })
        .select()
        .single()
        
      if (error) throw error
      if (data) {
        setActiveSessionId(data.id)
        setNotes('')
        setElapsedSeconds(0)
        setIsActive(true)
        setIsFullscreen(true)
      }
    } catch (err) {
      alert("Failed to establish secure focus environment database sync. Please check connectivity.")
      console.error(err)
    }
  }

  // 6. Complete Focus Session
  const handleSaveCompletion = async () => {
    if (!activeSessionId || !activeProfile) return
    setIsSubmitting(true)

    const actualMins = Math.max(1, Math.round(elapsedSeconds / 60))
    const finalGoal = selectedGoal === 'Custom' ? (customGoalText || 'Custom Goal') : selectedGoal

    try {
      // 1. Update focus session in DB
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

      // 2. Fetch current study stats to update increment
      const { data: stats } = await supabase
        .from('study_stats')
        .select('*')
        .eq('user_id', activeProfile.id)
        .maybeSingle()

      const nextMinutes = (stats?.total_study_minutes || 0) + actualMins
      const nextPomodoros = (stats?.completed_pomodoros || 0) + (isNoTimer ? 0 : 1)
      const nextStreak = stats?.current_streak || 1

      await supabase
        .from('study_stats')
        .update({
          total_study_minutes: nextMinutes,
          completed_pomodoros: nextPomodoros,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', activeProfile.id)

      // 3. Log to activity feed
      await supabase.from('activity_logs').insert({
        user_id: activeProfile.id,
        activity_type: 'study_session',
        description: `Logged a ${actualMins}-minute focus session for "${finalGoal}"`
      })

      // 4. Milestone Checks
      // 50 focus sessions completed
      if (nextPomodoros === 50) {
        await supabase.from('memories').insert({
          created_by: activeProfile.id,
          user_id: activeProfile.id,
          title: `Focus Milestone: 50 Study Sessions Completed! 🕯️`,
          description: `@${activeProfile.username} has logged 50 focus Pomodoros inside the Zen Focus space! Outstanding commitment.`,
          memory_type: 'study',
          type: 'milestone',
          visibility: 'public',
          related_users: [activeProfile.username]
        })
      }

      // 100 study hours (6000 minutes)
      const prevHours = Math.floor((stats?.total_study_minutes || 0) / 60)
      const nextHours = Math.floor(nextMinutes / 60)
      if (prevHours < 100 && nextHours >= 100) {
        await supabase.from('memories').insert({
          created_by: activeProfile.id,
          user_id: activeProfile.id,
          title: `Focus Milestone: 100 Study Hours Surpassed! 🏆`,
          description: `A monument of focus! @${activeProfile.username} reached 100 hours of total study focus time.`,
          memory_type: 'study',
          type: 'milestone',
          visibility: 'public',
          related_users: [activeProfile.username]
        })
      }

      // Reset active page states
      setActiveSessionId(null)
      setIsFullscreen(false)
      setShowCompletionModal(false)
      setAccomplishments('')
      setReflections('')
      setElapsedSeconds(0)
      
      // Reload statistics
      fetchUserAndStats()
    } catch (err) {
      alert("Failed to submit session details to database.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 7. Abandon Session Check
  const handleAbandonSession = async () => {
    if (!window.confirm("Are you sure you want to abandon this focus deck? The progress will not be permanently stored.")) return
    
    if (activeSessionId) {
      await supabase.from('focus_sessions').delete().eq('id', activeSessionId)
    }
    
    setActiveSessionId(null)
    setIsFullscreen(false)
    setIsActive(false)
    setShowCompletionModal(false)
    setElapsedSeconds(0)
  }

  const handleManualEndSession = () => {
    setIsActive(false)
    setShowCompletionModal(true)
  }

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Theme helper values
  const currentThemeConfig = AMBIENT_THEMES.find(t => t.id === selectedTheme) || AMBIENT_THEMES[0]
  const progressPercent = isNoTimer ? 100 : Math.min(100, (elapsedSeconds / (durationMinutes * 60)) * 100)

  return (
    <>
      {/* 1. Setup Screen (Rendered only when not in Fullscreen) */}
      {!isFullscreen && (
        <PageContainer>
          <SectionHeader 
            title="Zen Focus Hub" 
            description="Initiate high-bandwidth focus states in a customized, distraction-free environment."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Left 2 Cols: Setup Deck & Configuration */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Core Deck Panel */}
              <Card className="p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />
                
                {/* Step 1: Goal selection */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    1. select focus goal
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {GOAL_OPTIONS.map((g) => {
                      const IconComp = g.icon
                      const isSelected = selectedGoal === g.id
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGoal(g.id)}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-md shadow-amber-500/5' 
                              : 'bg-white/2 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <IconComp className={`h-4.5 w-4.5 shrink-0 ${g.color}`} />
                          <span>{g.name}</span>
                        </button>
                      )
                    })}
                  </div>
                  
                  {selectedGoal === 'Custom' && (
                    <input
                      type="text"
                      value={customGoalText}
                      onChange={(e) => setCustomGoalText(e.target.value)}
                      placeholder="e.g. Design app blueprints, Refactor server schemas..."
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-xs text-gray-800 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-all font-semibold"
                    />
                  )}
                </div>

                {/* Step 2: Session Configuration */}
                <div className="space-y-3 pt-3 border-t border-black/5 dark:border-white/5">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    2. duration config
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {[25, 45, 60, 90].map((min) => (
                      <button
                        key={min}
                        disabled={isNoTimer}
                        onClick={() => {
                          setDurationMinutes(min)
                          setCustomDurationInput('')
                        }}
                        className={`py-2 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          durationMinutes === min && !isNoTimer
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                            : 'bg-white/2 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {min} Min
                      </button>
                    ))}
                    
                    {/* Custom Minutes Input */}
                    <input
                      type="number"
                      disabled={isNoTimer}
                      placeholder="Custom Mins"
                      value={customDurationInput}
                      onChange={(e) => {
                        setCustomDurationInput(e.target.value)
                        const val = parseInt(e.target.value)
                        if (val > 0) setDurationMinutes(val)
                      }}
                      className="max-w-[110px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3 text-xs text-gray-800 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/30 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {/* No Timer Toggle */}
                    <button
                      onClick={() => {
                        setIsNoTimer(!isNoTimer)
                        if (!isNoTimer) setDurationMinutes(0)
                        else setDurationMinutes(25)
                      }}
                      className={`py-2 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                        isNoTimer
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-white/2 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>No Timer Mode (Stopwatch)</span>
                    </button>
                  </div>
                </div>

                {/* Step 3: Ambient Theme Selection */}
                <div className="space-y-3 pt-3 border-t border-black/5 dark:border-white/5">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    3. select ambient theme
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AMBIENT_THEMES.map((theme) => {
                      const isSelected = selectedTheme === theme.id
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            isSelected 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                              : 'bg-white/2 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="text-xs font-bold">{theme.name}</span>
                          <span className="text-[10px] text-gray-500 leading-tight">{theme.description}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleStartSession}
                    className="py-4 px-10 rounded-2xl bg-amber-500 hover:bg-amber-600 border border-transparent text-xs font-extrabold tracking-wide uppercase text-white shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    Initiate Focus Deck
                  </button>
                </div>
              </Card>

              {/* Focus Activity Feed / History */}
              <Card className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BookText className="h-4 w-4 text-amber-400" />
                  Recent Focus Logs
                </h3>

                <div className="space-y-3 pt-1">
                  {recentSessions.length === 0 ? (
                    <p className="text-xs text-gray-500 font-semibold text-center py-4 lowercase">no completed focus cycles cataloged yet.</p>
                  ) : (
                    recentSessions.map((session) => (
                      <div 
                        key={session.id} 
                        className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3.5 rounded-2xl text-xs space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 dark:text-gray-200 lowercase">
                            {session.goal}
                          </span>
                          <span className="text-[9px] font-bold text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/10 lowercase">
                            {session.actual_minutes} Mins
                          </span>
                        </div>
                        
                        {session.accomplishments && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                            <span className="text-gray-400 lowercase font-bold block mb-0.5">accomplished:</span>
                            {session.accomplishments}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold pt-1 border-t border-black/5 dark:border-white/5">
                          <span>Theme: {session.theme.replace('_', ' ')}</span>
                          <span>{new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Right 1 Col: Statistics and Policies */}
            <div className="space-y-4">
              
              {/* Focus Stats aggregate */}
              <Card className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-rose-400" />
                  Zen focus metrics
                </h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Total Focus Hours</span>
                    <span className="text-white font-bold">{focusStats.totalHours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Total Focus Sessions</span>
                    <span className="text-gray-300 font-bold">{focusStats.totalSessions} sessions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Weekly Focus Time</span>
                    <span className="text-amber-400 font-bold">
                      {Math.round(focusStats.weeklyMinutes / 60)}h {focusStats.weeklyMinutes % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Monthly Focus Time</span>
                    <span className="text-cyan-400 font-bold">
                      {Math.round(focusStats.monthlyMinutes / 60)}h {focusStats.monthlyMinutes % 60}m
                    </span>
                  </div>
                </div>
              </Card>

              {/* Policy & Tips */}
              <Card className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Productivity Policy
                </h3>
                <div className="text-[11px] text-gray-400 leading-relaxed font-medium space-y-2">
                  <p>
                    Zen Focus integrates custom browser environments to maximize deep cognitive flow states. Place peripheral devices out of view.
                  </p>
                  <p>
                    Every completed session directly aggregates into your Career Dashboard, validating and proving your technical commitment.
                  </p>
                </div>
              </Card>

            </div>
          </div>
        </PageContainer>
      )}

      {/* 2. Fullscreen Active Mode Viewport */}
      {isFullscreen && (
        <div className={`fixed inset-0 z-[9999] flex flex-col justify-between p-6 sm:p-12 transition-all duration-700 animate-pageFadeIn select-none overflow-hidden ${currentThemeConfig.bg}`}>
          
          {/* Theme Specific Graphic Animations */}
          {selectedTheme === 'minimal_zen' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-[40vw] w-[40vw] rounded-full bg-amber-500/5 dark:bg-amber-500/[0.03] blur-3xl animate-breathing" />
            </div>
          )}

          {selectedTheme === 'rain' && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="rainPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <line x1="10" y1="0" x2="10" y2="20" stroke="rgba(14, 165, 233, 0.4)" strokeWidth="1" />
                    <line x1="30" y1="20" x2="30" y2="40" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#rainPattern)" className="animate-rain-fall" />
              </svg>
            </div>
          )}

          {selectedTheme === 'aurora' && (
            <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.15),transparent_60%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_60%)] animate-aurora" />
          )}

          {selectedTheme === 'deep_space' && (
            <div className="absolute inset-0 pointer-events-none opacity-80">
              {/* Rendering 15 absolute stars with different layouts */}
              {[...Array(15)].map((_, i) => (
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

          {/* Fullscreen Header */}
          <div className="relative z-10 flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Focusing On</span>
              <h2 className="text-base sm:text-lg font-black text-white lowercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                {selectedGoal === 'Custom' ? customGoalText : selectedGoal}
              </h2>
            </div>

            <button
              onClick={handleAbandonSession}
              className="py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X className="h-4 w-4" />
              <span>Abandon Session</span>
            </button>
          </div>

          {/* Fullscreen Body Center */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 my-auto max-w-5xl mx-auto w-full h-[60vh]">
            
            {/* Timer Core Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              
              {/* Floating Glass Timer Screen */}
              <div className="py-10 px-14 rounded-3xl bg-black/20 dark:bg-white/[0.02] border border-white/5 backdrop-blur-xl flex flex-col items-center justify-center relative min-w-[280px] sm:min-w-[320px]">
                {/* Circular timer indicator ring inside layout */}
                <svg className="absolute inset-0 w-full h-full p-2 pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="2" />
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

                <span className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.08)]">
                  {isNoTimer ? formatTime(elapsedSeconds) : formatTime(Math.max(0, (durationMinutes * 60) - elapsedSeconds))}
                </span>
                
                <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mt-4">
                  {isActive ? 'Flow State Synchronized' : 'Flow State Paused'}
                </p>
              </div>

              {/* Central Action Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`py-4 px-10 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg ${
                    isActive 
                      ? 'bg-amber-500/10 border border-amber-500/35 text-amber-300 hover:bg-amber-500/20' 
                      : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Pause className="h-4.5 w-4.5 shrink-0" />
                      <span>Pause Deck</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4.5 w-4.5 shrink-0" />
                      <span>Resume Flow</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleManualEndSession}
                  className="py-4 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer"
                >
                  End Session
                </button>
              </div>
            </div>

            {/* Notes Notepad Sidebar */}
            <div className="w-full lg:w-[400px] h-full flex flex-col bg-black/10 dark:bg-white/[0.01] border border-white/5 rounded-3xl p-5 backdrop-blur-xl relative">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <BookText className="h-4 w-4 text-amber-400" />
                  light notepad
                </h3>
                
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {notesSavedStatus === 'saving' && <span className="text-amber-400 animate-pulse">Autosaving...</span>}
                  {notesSavedStatus === 'saved' && <span className="text-emerald-400 flex items-center gap-1"><Save className="h-3 w-3" /> Sync Saved</span>}
                  {notesSavedStatus === 'error' && <span className="text-red-400">Offline Cache</span>}
                </span>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Autosave notepad. Put links, checklist items, blueprints, or reflection keywords here..."
                className="flex-1 bg-black/20 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/30 transition-all font-semibold resize-none h-full"
              />
            </div>

          </div>

          {/* Fullscreen Footer */}
          <div className="relative z-10 flex justify-between items-center w-full text-xs text-gray-500 font-bold border-t border-white/5 pt-4">
            <span className="lowercase">ambient theme: {currentThemeConfig.name}</span>
            <span className="lowercase">elapsed focus: {Math.round(elapsedSeconds / 60)} minutes</span>
          </div>

          {/* 3. Session Completion Modal Flow */}
          {showCompletionModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

              <div className="relative w-full max-w-lg bg-[#fdfbf7] dark:bg-[#12141a] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
                  reflect & catalog focus cycle
                </h3>

                <div className="space-y-4 mt-5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {/* Task accomplished */}
                  <div className="space-y-1">
                    <label className="text-gray-400 block">What did you accomplish during this cycle?</label>
                    <input
                      type="text"
                      required
                      value={accomplishments}
                      onChange={(e) => setAccomplishments(e.target.value)}
                      placeholder="e.g. Completed page structures, refactored dashboard API routes..."
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-3 text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Rating / focus intensity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-gray-400">
                      <label>Focus level / mental bandwidth rating</label>
                      <span className="text-amber-500 font-black">{reflectionRating}/10</span>
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

                  {/* Reflections textarea */}
                  <div className="space-y-1">
                    <label className="text-gray-400 block">General notes & reflections (optional)</label>
                    <textarea
                      value={reflections}
                      onChange={(e) => setReflections(e.target.value)}
                      placeholder="How was the environment? Any roadblocks? Write reflection logs here..."
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-3.5 text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 resize-none h-20"
                    />
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleAbandonSession}
                      className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-transparent rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !accomplishments.trim()}
                      onClick={handleSaveCompletion}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white border-transparent rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{isSubmitting ? 'Cataloging...' : 'Catalog Focus Cycle'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
