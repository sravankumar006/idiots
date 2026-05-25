'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Play, Square, BookOpen, Brain, Flame, Volume2, Sparkles,
  Music, VolumeX, Moon, CloudRain, Wind, Radio, Info
} from 'lucide-react'

// Avatar palette for displaying study presence
const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-indigo-400 to-purple-500',  symbol: 'CM' },
  'avatar-neon-pulse':   { gradient: 'from-purple-400 to-pink-500',    symbol: 'SL' },
  'avatar-alpha-wing':   { gradient: 'from-emerald-400 to-teal-500',   symbol: 'MM' },
  'avatar-solar-flare':  { gradient: 'from-orange-300 to-rose-400',    symbol: 'WP' },
  'avatar-void-runner':  { gradient: 'from-rose-400 to-pink-500',      symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500',   symbol: 'MS' },
}

interface StudyPanelProps {
  groupId: string
  activeUserId: string
  onlineUsers: Record<string, any>
  myFocus: {
    isFocusing: boolean
    status: string
    focusSince: string | null
    isDeepFocus: boolean
  }
  updateFocusStatus: (isFocusing: boolean, status: string, isDeepFocus: boolean) => Promise<void>
  
  // Realtime Timer Sync
  timerEndsAt: string | null
  timerDuration: number
  timerType: 'idle' | 'focus' | 'break'
  startTimer: (seconds: number, type: 'focus' | 'break') => Promise<void>
  stopTimer: () => Promise<void>
}

export default function StudyPanel({
  groupId,
  activeUserId,
  onlineUsers,
  myFocus,
  updateFocusStatus,
  timerEndsAt,
  timerDuration,
  timerType,
  startTimer,
  stopTimer
}: StudyPanelProps) {
  // ── Local countdown timer derived from timerEndsAt ──
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!timerEndsAt) {
      setTimeLeft(0)
      return
    }

    const updateTimer = () => {
      const endsTime = new Date(timerEndsAt).getTime()
      const diff = Math.max(0, Math.floor((endsTime - Date.now()) / 1000))
      setTimeLeft(diff)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 500)
    return () => clearInterval(interval)
  }, [timerEndsAt])

  // Formatted MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Timer Progress percentage
  const progressPercent = useMemo(() => {
    if (timerDuration <= 0 || timeLeft <= 0) return 0
    return ((timerDuration - timeLeft) / timerDuration) * 100
  }, [timeLeft, timerDuration])

  // ── Custom Status states ──
  const [statusInput, setStatusInput] = useState(myFocus.status)
  
  // Sync input value if parent focus state updates from elsewhere
  useEffect(() => {
    setStatusInput(myFocus.status)
  }, [myFocus.status])

  const handleUpdateFocus = (isFocusing: boolean, isDeep: boolean = myFocus.isDeepFocus) => {
    updateFocusStatus(isFocusing, statusInput.trim(), isDeep)
  }

  // ── Mock Lofi / Ambient audio state ──
  const [lofiPlaying, setLofiPlaying] = useState(false)
  const [lofiTrack, setLofiTrack] = useState('lo-fi late night session')
  const [volume, setVolume] = useState(40)
  const [ambientSounds, setAmbientSounds] = useState<Record<string, boolean>>({
    rain: false,
    forest: false,
    fireplace: false,
  })

  // List of other users who are currently studying/focusing
  const studyBuddies = useMemo(() => {
    return Object.values(onlineUsers).filter((u: any) => u.userId !== activeUserId && u.isFocusing)
  }, [onlineUsers, activeUserId])

  // Focus duration string helper
  const getFocusMins = (focusSince: string | null) => {
    if (!focusSince) return 0
    const diffMs = Date.now() - new Date(focusSince).getTime()
    return Math.max(0, Math.floor(diffMs / 60000))
  }

  return (
    <div className="w-80 border-l border-black/5 dark:border-white/[0.05] bg-[#faf8f5] dark:bg-[#121216] flex flex-col h-full overflow-y-auto shrink-0 select-none animate-fadeIn">
      
      {/* ── Header ── */}
      <div className="p-4 border-b border-black/5 dark:border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold tracking-tight lowercase text-gray-700 dark:text-gray-300">
            study room
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wider animate-pulse">
          <Flame className="h-3 w-3" />
          zen mode
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1">
        
        {/* ══════════════════════════════════════
            1. GROUP SYNCHRONIZED TIMER
            ══════════════════════════════════════ */}
        <section className="bg-white dark:bg-[#18181f] rounded-2xl p-4 border border-black/5 dark:border-white/[0.05] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 lowercase">
              {timerType === 'focus' ? '🎯 focus session' : timerType === 'break' ? '☕ break session' : '🕒 study timer'}
            </span>
            {timerType !== 'idle' && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                shared countdown
              </span>
            )}
          </div>

          {/* Time Display and Circular Progress */}
          <div className="flex flex-col items-center justify-center my-4 relative">
            <div className="relative flex items-center justify-center h-28 w-28 rounded-full border border-black/[0.04] dark:border-white/[0.02] bg-[#faf8f5]/50 dark:bg-[#121216]/50 shadow-inner">
              
              {/* Simple progress ring via SVG */}
              <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="52"
                  className="stroke-[#eae7df] dark:stroke-white/[0.04]"
                  strokeWidth="4"
                  fill="transparent"
                />
                {timerType !== 'idle' && (
                  <circle
                    cx="56"
                    cy="56"
                    r="52"
                    className={`${timerType === 'break' ? 'stroke-emerald-400' : 'stroke-amber-400'} transition-all duration-500`}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - progressPercent / 100)}
                  />
                )}
              </svg>
              
              <div className="text-center z-10">
                <span className="text-2xl font-bold font-mono tracking-tight text-gray-800 dark:text-gray-100">
                  {timerType !== 'idle' ? formatTime(timeLeft) : '00:00'}
                </span>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 lowercase mt-0.5">
                  {timerType !== 'idle' ? timerType : 'ready'}
                </p>
              </div>
            </div>
          </div>

          {/* Timer Actions */}
          {timerType === 'idle' ? (
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => startTimer(1500, 'focus')}
                className="py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer lowercase"
              >
                focus 25m
              </button>
              <button
                onClick={() => startTimer(300, 'break')}
                className="py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer lowercase"
              >
                break 5m
              </button>
              <button
                onClick={() => startTimer(3000, 'focus')}
                className="py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:bg-black/[0.05] dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-300 text-xs font-medium transition-all active:scale-95 cursor-pointer lowercase col-span-2"
              >
                long session (50m)
              </button>
            </div>
          ) : (
            <div className="flex justify-center mt-3">
              <button
                onClick={stopTimer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer"
              >
                <Square className="h-3 w-3 fill-rose-500" />
                stop timer
              </button>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════
            2. FOCUS PROFILE SETUP
            ══════════════════════════════════════ */}
        <section className="space-y-3">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
            my focus activity
          </span>
          <div className="bg-white dark:bg-[#18181f] rounded-2xl p-4 border border-black/5 dark:border-white/[0.05] shadow-sm space-y-3.5">
            <div>
              <label htmlFor="focus-input" className="sr-only">What are you studying?</label>
              <input
                id="focus-input"
                type="text"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value.slice(0, 30))}
                placeholder="what are you studying? (e.g. solving DSA)"
                className="w-full text-xs bg-black/[0.03] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 placeholder:dark:text-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* Deep Focus Toggle */}
              <button
                onClick={() => updateFocusStatus(myFocus.isFocusing, statusInput, !myFocus.isDeepFocus)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  myFocus.isDeepFocus
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-500 shadow-sm shadow-amber-500/5 animate-pulse'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                }`}
                title="Reduces client animations and blocks unnecessary notifications"
              >
                <Moon className={`h-3.5 w-3.5 ${myFocus.isDeepFocus ? 'fill-amber-500' : ''}`} />
                deep focus
              </button>

              {/* Study Toggle */}
              <button
                onClick={() => handleUpdateFocus(!myFocus.isFocusing)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  myFocus.isFocusing
                    ? 'bg-emerald-500 text-white border-transparent shadow-md shadow-emerald-500/20'
                    : 'bg-amber-500 text-white border-transparent shadow-md shadow-amber-500/20 hover:bg-amber-600'
                }`}
              >
                {myFocus.isFocusing ? (
                  <>
                    <Square className="h-3 w-3 fill-white" />
                    stop focus
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-white" />
                    start focus
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            3. STUDY BUDDIES PRESENCE
            ══════════════════════════════════════ */}
        <section className="space-y-2">
          <div className="flex items-center justify-between pl-1">
            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              friends studying
            </span>
            <span className="text-[10px] text-gray-400 lowercase">
              {studyBuddies.length} focused
            </span>
          </div>

          <div className="space-y-1.5">
            {studyBuddies.length === 0 ? (
              <div className="bg-white/40 dark:bg-white/[0.02] border border-dashed border-black/5 dark:border-white/5 rounded-2xl p-4 text-center">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed lowercase">
                  no friends studying yet.<br />start focusing to inspire them!
                </p>
              </div>
            ) : (
              studyBuddies.map((buddy: any) => {
                const avatar = AVATAR_MAP[buddy.avatar] || { gradient: 'from-slate-400 to-indigo-500', symbol: 'EX' }
                const isDeep = !!buddy.isDeepFocus
                return (
                  <div
                    key={buddy.userId}
                    className={`flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#18181f] border border-black/5 dark:border-white/[0.05] shadow-sm transition-all duration-300 ${
                      isDeep ? 'ring-1 ring-amber-500/20 bg-amber-500/[0.02] dark:bg-amber-500/[0.01]' : ''
                    }`}
                  >
                    {/* User Avatar with Glowing Focus Status */}
                    <div className="relative shrink-0 select-none">
                      <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                        {avatar.symbol}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#18181f] ${
                        isDeep ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {buddy.username}
                        </span>
                        {buddy.focusSince && (
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 shrink-0 font-medium">
                            focused {getFocusMins(buddy.focusSince)}m
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate lowercase mt-0.5 font-medium">
                        {isDeep ? '🤫 in deep focus' : buddy.focusStatus || 'focusing quietly'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════
            4. FOCUS MUSIC & SOUNDS (MOCK/PLACEHOLDER)
            ══════════════════════════════════════ */}
        <section className="space-y-3">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
            focus sounds
          </span>
          <div className="bg-white dark:bg-[#18181f] rounded-2xl p-4 border border-black/5 dark:border-white/[0.05] shadow-sm space-y-4">
            
            {/* Lofi Radio Panel */}
            <div className="flex items-center justify-between gap-3 p-2 bg-[#faf8f5] dark:bg-[#121216] rounded-xl border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 ${lofiPlaying ? 'animate-spin-slow' : ''}`}>
                  <Music className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">lofi radio</span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium truncate block lowercase">{lofiTrack}</span>
                </div>
              </div>
              
              <button
                onClick={() => setLofiPlaying(!lofiPlaying)}
                className={`h-7 w-7 rounded-full flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                  lofiPlaying
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                    : 'bg-amber-500 text-white border-transparent hover:bg-amber-600'
                }`}
                title={lofiPlaying ? 'Pause' : 'Play Lofi'}
              >
                {lofiPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white pl-0.5" />}
              </button>
            </div>

            {/* Audio Controls */}
            {lofiPlaying && (
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>radio station</span>
                  <select
                    value={lofiTrack}
                    onChange={(e) => setLofiTrack(e.target.value)}
                    className="bg-transparent border-none text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="lo-fi late night session">Late Night Lofi</option>
                    <option value="study beats radio">Study Beats</option>
                    <option value="synthwave study space">Synthwave Space</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-black/5 dark:bg-white/5 rounded-lg appearance-none cursor-pointer"
                    aria-label="Volume slider"
                  />
                  <span className="text-[9px] font-mono text-gray-400 w-6 text-right shrink-0">{volume}%</span>
                </div>
              </div>
            )}

            {/* Ambient sound loops (mock triggers) */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">ambient mixes</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'rain', label: 'rain', icon: CloudRain },
                  { id: 'forest', label: 'wind', icon: Wind },
                  { id: 'fireplace', label: 'fireplace', icon: Moon },
                ].map((sound) => {
                  const active = ambientSounds[sound.id]
                  return (
                    <button
                      key={sound.id}
                      onClick={() => setAmbientSounds(prev => ({ ...prev, [sound.id]: !prev[sound.id] }))}
                      className={`flex flex-col items-center gap-1 py-1.5 px-1.5 rounded-xl border text-[9px] font-semibold tracking-wide transition-all active:scale-95 cursor-pointer ${
                        active
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <sound.icon className="h-3.5 w-3.5" />
                      {sound.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Shared audio placeholder */}
            <button
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-[10px] text-gray-400 dark:text-gray-500 transition-all font-medium select-none"
              title="Share what you are listening to with friends in the group"
            >
              <Radio className="h-3.5 w-3.5" />
              sync listening (coming soon)
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
