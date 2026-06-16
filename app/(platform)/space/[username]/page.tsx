'use client'

import React, { use, useState, useEffect, useRef, useMemo } from 'react'
import {
  Volume2, VolumeX, Play, Pause, Music, Flame, Quote, Save,
  Settings2, Heart, Coffee, CloudRain, Waves, Trees, ArrowRight,
  Sparkles, Award, User, RefreshCw, BarChart2, ChevronUp, ChevronDown, CheckCircle2,
  Lock, Eye, ImageIcon, Code
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'silence 🧘', icon: VolumeX, url: '' },
  { id: 'rain', name: 'soft rain 🌧️', icon: CloudRain, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'campfire', name: 'campfire 🔥', icon: Flame, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'cafe', name: 'cafe jazz ☕', icon: Coffee, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'forest', name: 'forest wind 🌲', icon: Trees, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 'waves', name: 'ocean waves 🌊', icon: Waves, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
]

interface SpacePageProps {
  params: Promise<{ username: string }>
}

export default function SpacePage({ params }: SpacePageProps) {
  const resolvedParams = use(params)
  const username = decodeURIComponent(resolvedParams.username)

  const supabase = createClient()
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Audio refs
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null)
  const songAudioRef = useRef<HTMLAudioElement | null>(null)

  // Local audio states
  const [ambientPlaying, setAmbientPlaying] = useState(false)
  const [ambientVolume, setAmbientVolume] = useState(0.4)
  const [songPlaying, setSongPlaying] = useState(false)
  const [songVolume, setSongVolume] = useState(0.5)

  // Edit Space modal state
  const [showConfig, setShowConfig] = useState(false)
  const [editingBanner, setEditingBanner] = useState('')
  const [editingQuote, setEditingQuote] = useState('')
  const [editingSongTitle, setEditingSongTitle] = useState('')
  const [editingSongUrl, setEditingSongUrl] = useState('')
  const [editingPlaylistUrl, setEditingPlaylistUrl] = useState('')
  const [editingCodingGoals, setEditingCodingGoals] = useState('')
  const [editingStudyGoals, setEditingStudyGoals] = useState('')
  const [editingStatus, setEditingStatus] = useState('')

  // Edit Mood state
  const [showMoodLog, setShowMoodLog] = useState(false)
  const [newMood, setNewMood] = useState(7)
  const [newEnergy, setNewEnergy] = useState(6)
  const [newFocus, setNewFocus] = useState(8)
  const [newStatus, setNewStatus] = useState('')

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
    careerProfile,
    codingStats,
    studyStats
  } = useDashboardData(activeProfile, targetProfile?.id)

  // Audio setup triggers
  useEffect(() => {
    if (!spaceData) return

    // Setup ambient audio URL
    const activeAmbient = AMBIENT_SOUNDS.find(s => s.id === spaceData.ambient_sound)
    if (activeAmbient && activeAmbient.url) {
      if (!ambientAudioRef.current) {
        ambientAudioRef.current = new Audio(activeAmbient.url)
        ambientAudioRef.current.loop = true
      } else {
        ambientAudioRef.current.src = activeAmbient.url
      }
      ambientAudioRef.current.volume = ambientVolume

      if (ambientPlaying) {
        ambientAudioRef.current.play().catch(() => setAmbientPlaying(false))
      }
    } else {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause()
        setAmbientPlaying(false)
      }
    }

    // Setup Vibe song URL
    if (spaceData.song_url) {
      if (!songAudioRef.current) {
        songAudioRef.current = new Audio(spaceData.song_url)
        songAudioRef.current.loop = true
      } else {
        songAudioRef.current.src = spaceData.song_url
      }
      songAudioRef.current.volume = songVolume

      if (songPlaying) {
        songAudioRef.current.play().catch(() => setSongPlaying(false))
      }
    } else {
      if (songAudioRef.current) {
        songAudioRef.current.pause()
        setSongPlaying(false)
      }
    }

    // Handle initial autoplays
    if (spaceData.music_autoplay && spaceData.song_url && !songPlaying) {
      setTimeout(() => {
        if (songAudioRef.current) {
          songAudioRef.current.play()
            .then(() => setSongPlaying(true))
            .catch(() => {})
        }
      }, 1000)
    }

    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause()
      }
      if (songAudioRef.current) {
        songAudioRef.current.pause()
      }
    }
  }, [spaceData])

  // Handle ambient volume change
  const handleAmbientVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setAmbientVolume(vol)
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = vol
    }
  }

  // Handle song volume change
  const handleSongVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setSongVolume(vol)
    if (songAudioRef.current) {
      songAudioRef.current.volume = vol
    }
  }

  // Toggle ambient play
  const toggleAmbientPlaying = () => {
    if (!ambientAudioRef.current) return
    if (ambientPlaying) {
      ambientAudioRef.current.pause()
      setAmbientPlaying(false)
    } else {
      ambientAudioRef.current.play().then(() => setAmbientPlaying(true)).catch(() => {})
    }
  }

  // Toggle song play
  const toggleSongPlaying = () => {
    if (!songAudioRef.current) return
    if (songPlaying) {
      songAudioRef.current.pause()
      setSongPlaying(false)
    } else {
      songAudioRef.current.play().then(() => setSongPlaying(true)).catch(() => {})
    }
  }

  // Open config modal with current values
  const openConfigModal = () => {
    if (!spaceData) return
    setEditingBanner(spaceData.profile_banner)
    setEditingQuote(spaceData.favorite_quote)
    setEditingSongTitle(spaceData.song_title)
    setEditingSongUrl(spaceData.song_url)
    setEditingPlaylistUrl(spaceData.study_playlist_url)
    setEditingCodingGoals(spaceData.coding_goals?.join(', ') || '')
    setEditingStudyGoals(spaceData.study_goals?.join(', ') || '')
    setEditingStatus(spaceData.current_status)
    setShowConfig(true)
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfig(false)
    await updateSpaceData({
      profile_banner: editingBanner,
      favorite_quote: editingQuote,
      pinned_quote: editingQuote, // compatibility
      song_title: editingSongTitle,
      song_url: editingSongUrl,
      study_playlist_url: editingPlaylistUrl,
      coding_goals: editingCodingGoals.split(',').map(s => s.trim()).filter(Boolean),
      study_goals: editingStudyGoals.split(',').map(s => s.trim()).filter(Boolean),
      current_status: editingStatus
    })
  }

  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowMoodLog(false)
    await logMood(newMood, newEnergy, newFocus, newStatus, 'public')
    setNewStatus('')
  }

  const moveWidget = async (index: number, direction: 'up' | 'down') => {
    if (!spaceData || isReadOnly) return
    const layout = [...spaceData.widgets_layout]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= layout.length) return

    // swap
    const temp = layout[index]
    layout[index] = layout[targetIdx]
    layout[targetIdx] = temp

    await updateSpaceData({ widgets_layout: layout })
  }

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

  // Calculate statistics totals
  const totalSolved = codingStats ? (codingStats.leetcode_solved + codingStats.hackerrank_solved + codingStats.codeforces_solved) : 0
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
                className="py-2 px-3.5 rounded-xl bg-neo-bg shadow-neo border-none text-[11px] font-bold text-[#fb864b] hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Room Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Outer widget grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns - Rearrangeable widgets */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ambient sound deck */}
            <Card className="p-6 relative overflow-hidden glass-panel border-none">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-violet-400" />
                room ambience generator
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AMBIENT_SOUNDS.map((sound) => {
                  const IconObj = sound.icon
                  const isActive = spaceData.ambient_sound === sound.id

                  return (
                    <button
                      key={sound.id}
                      disabled={isReadOnly}
                      onClick={() => updateSpaceData({ ambient_sound: sound.id })}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-none transition-all text-xs font-bold ${
                        isReadOnly ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        isActive
                          ? 'bg-neo-bg shadow-neo-inset text-[#fb864b]'
                          : 'bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5'
                      }`}
                    >
                      <IconObj className={`h-4.5 w-4.5 shrink-0 ${isActive && ambientPlaying ? 'animate-pulse text-violet-400' : ''}`} />
                      <span>{sound.name}</span>
                    </button>
                  )
                })}
              </div>

              {spaceData.ambient_sound !== 'none' && (
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAmbientPlaying}
                      className="h-9 w-9 rounded-full bg-violet-600 hover:bg-violet-500 text-gray-900 dark:text-white flex items-center justify-center cursor-pointer shadow-md"
                    >
                      {ambientPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
                    </button>
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold uppercase">ambient state</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {ambientPlaying ? 'Synthesizing frequencies...' : 'Ambient paused'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onChange={handleAmbientVolumeChange}
                      className="w-24 accent-violet-500 h-1 rounded-full cursor-pointer bg-white/10"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Sorted widgets stack */}
            <div className="space-y-6">
              {spaceData.widgets_layout.map((widgetKey, idx) => {
                
                // 1. Mood Widget
                if (widgetKey === 'mood') {
                  return (
                    <Card key="mood" className="p-6 relative overflow-hidden glass-panel border-none group">
                      {!isReadOnly && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveWidget(idx, 'up')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => moveWidget(idx, 'down')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                      )}

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
                              <span className="text-lg font-black text-[#fb864b]">{latestMood?.focus_level || 5}/10</span>
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
                  )
                }

                // 2. Favorite Quote
                if (widgetKey === 'quote') {
                  return (
                    <Card key="quote" className="p-6 relative overflow-hidden glass-panel border-none group">
                      {!isReadOnly && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveWidget(idx, 'up')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => moveWidget(idx, 'down')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                      )}

                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Quote className="h-4 w-4 text-amber-400" />
                        favorite quote
                      </h3>
                      
                      <div className="py-2 pl-4 border-l-2 border-amber-400/40">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed italic">
                          "{spaceData.favorite_quote || 'stay warm, stay coding.'}"
                        </p>
                      </div>
                    </Card>
                  )
                }

                // 3. Music player
                if (widgetKey === 'music') {
                  return (
                    <Card key="music" className="p-6 relative overflow-hidden glass-panel border-none group">
                      {!isReadOnly && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveWidget(idx, 'up')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => moveWidget(idx, 'down')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                      )}

                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Music className="h-4 w-4 text-emerald-400" />
                        favorite profile vibe track
                      </h3>

                      {spaceData.song_url ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 neo-inset-panel border-none p-4 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className={`h-11 w-11 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg font-bold text-black ${songPlaying ? 'animate-spin-slow' : ''}`}>
                              <Music className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold uppercase">now playing</span>
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{spaceData.song_title || 'unnamed track'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <button
                              onClick={toggleSongPlaying}
                              className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center cursor-pointer shadow-md"
                            >
                              {songPlaying ? <Pause className="h-4.5 w-4.5 fill-black" /> : <Play className="h-4.5 w-4.5 fill-black ml-0.5" />}
                            </button>
                            
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={songVolume}
                                onChange={handleSongVolumeChange}
                                className="w-20 accent-emerald-500 h-1 rounded-full cursor-pointer bg-white/10"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
                          no profile vibe track linked.
                        </div>
                      )}
                    </Card>
                  )
                }

                // 4. Personal Goals
                if (widgetKey === 'goals') {
                  return (
                    <Card key="goals" className="p-6 relative overflow-hidden glass-panel border-none group">
                      {!isReadOnly && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveWidget(idx, 'up')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => moveWidget(idx, 'down')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                        {/* Coding goals list */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Code className="h-4 w-4 text-sky-400" />
                            coding goals
                          </h3>
                          <div className="space-y-2.5">
                            {spaceData.coding_goals && spaceData.coding_goals.length > 0 ? (
                              spaceData.coding_goals.map((g, i) => (
                                <div key={i} className="flex items-center gap-2.5 neo-inset-panel border-none p-2.5 rounded-xl">
                                  <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                                  <span className="text-gray-800 dark:text-gray-200">{g}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 italic">No coding goals set yet.</div>
                            )}
                          </div>
                        </div>

                        {/* Study goals list */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Award className="h-4 w-4 text-violet-400" />
                            study goals
                          </h3>
                          <div className="space-y-2.5">
                            {spaceData.study_goals && spaceData.study_goals.length > 0 ? (
                              spaceData.study_goals.map((g, i) => (
                                <div key={i} className="flex items-center gap-2.5 neo-inset-panel border-none p-2.5 rounded-xl">
                                  <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
                                  <span className="text-gray-800 dark:text-gray-200">{g}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 italic">No study goals set yet.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                }

                // 5. Study Streaks
                if (widgetKey === 'streak' && studyStats) {
                  return (
                    <Card key="streak" className="p-6 relative overflow-hidden glass-panel border-none group">
                      {!isReadOnly && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveWidget(idx, 'up')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => moveWidget(idx, 'down')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                      )}

                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-400" />
                        cozy study stats
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="neo-inset-panel border-none p-3 rounded-2xl text-center">
                          <span className="text-[9px] text-neo-secondary uppercase block font-bold">active streak</span>
                          <span className="text-xl font-black text-orange-400">{studyStats.current_streak} days 🔥</span>
                        </div>
                        <div className="neo-inset-panel border-none p-3 rounded-2xl text-center">
                          <span className="text-[9px] text-neo-secondary uppercase block font-bold">study total</span>
                          <span className="text-xl font-black text-emerald-400">{(studyStats.total_study_minutes / 60).toFixed(1)} hrs</span>
                        </div>
                      </div>
                    </Card>
                  )
                }

                // 6. Coding contributions Solved
                if (widgetKey === 'contributions' && codingStats) {
                  return (
                    <Card key="contributions" className="p-6 relative overflow-hidden glass-panel border-none group">
                      {!isReadOnly && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveWidget(idx, 'up')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => moveWidget(idx, 'down')} className="p-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white cursor-pointer"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                      )}

                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-violet-400" />
                        coding progress
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="neo-inset-panel border-none p-3 rounded-2xl text-center">
                          <span className="text-[9px] text-neo-secondary uppercase block font-bold">DSA Solved</span>
                          <span className="text-xl font-black text-[#fb864b]">{totalSolved}</span>
                        </div>
                        <div className="neo-inset-panel border-none p-3 rounded-2xl text-center">
                          <span className="text-[9px] text-neo-secondary uppercase block font-bold">Commits</span>
                          <span className="text-xl font-black text-cyan-400">{codingStats.github_contributions}</span>
                        </div>
                      </div>
                    </Card>
                  )
                }

                return null
              })}
            </div>

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
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Ambient Vibe:</span>
                  <span className="text-emerald-400">{spaceData.ambient_sound}</span>
                </div>
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

          </div>

        </div>

        {/* Modal: Customize Room Settings */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfig(false)} />
            
            <div className="relative w-full max-w-lg glass-panel border-none rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold max-h-[90vh] overflow-y-auto">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 pb-3">
                configure digital room settings
              </h3>

              <form onSubmit={handleSaveConfig} className="space-y-4 mt-4 text-gray-700 dark:text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Theme Accent Color</label>
                    <select
                      value={spaceData.theme_colors}
                      onChange={(e) => updateSpaceData({ theme_colors: e.target.value })}
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
                      value={spaceData.profile_wallpaper}
                      onChange={(e) => updateSpaceData({ profile_wallpaper: e.target.value })}
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
                      value={spaceData.profile_accents}
                      onChange={(e) => updateSpaceData({ profile_accents: e.target.value })}
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none"
                    >
                      <option value="none" className="bg-white dark:bg-[#141520]">None</option>
                      <option value="stars" className="bg-white dark:bg-[#141520]">Star Sparkles 🌌</option>
                      <option value="bubbles" className="bg-white dark:bg-[#141520]">Floating Bubbles 🫧</option>
                      <option value="neon" className="bg-white dark:bg-[#141520]">Neon Pulsing Border ⚡</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Autoplay Profile Vibe Song</label>
                    <div className="flex items-center mt-2.5">
                      <input
                        type="checkbox"
                        checked={spaceData.music_autoplay}
                        onChange={(e) => updateSpaceData({ music_autoplay: e.target.checked })}
                        className="h-4.5 w-4.5 rounded border-black/10 dark:border-white/10 text-violet-500 cursor-pointer"
                        id="autoplay-chk"
                      />
                      <label htmlFor="autoplay-chk" className="ml-2 cursor-pointer text-gray-700 dark:text-gray-300 font-semibold">Enable autoplay on visit</label>
                    </div>
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

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Favorite Quote / Vibe Quote</label>
                    <input
                      type="text"
                      value={editingQuote}
                      onChange={(e) => setEditingQuote(e.target.value)}
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Vibe Song Title</label>
                    <input
                      type="text"
                      value={editingSongTitle}
                      onChange={(e) => setEditingSongTitle(e.target.value)}
                      placeholder="e.g. Lo-Fi Beats"
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 block mb-1">Vibe Song MP3 URL</label>
                    <input
                      type="url"
                      value={editingSongUrl}
                      onChange={(e) => setEditingSongUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 dark:text-gray-400 block mb-1">Coding Goals (comma-separated list)</label>
                  <input
                    type="text"
                    value={editingCodingGoals}
                    onChange={(e) => setEditingCodingGoals(e.target.value)}
                    placeholder="Goal 1, Goal 2, Goal 3"
                    className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="text-gray-500 dark:text-gray-400 block mb-1">Study Goals (comma-separated list)</label>
                  <input
                    type="text"
                    value={editingStudyGoals}
                    onChange={(e) => setEditingStudyGoals(e.target.value)}
                    placeholder="Goal 1, Goal 2, Goal 3"
                    className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
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
                    Save Space Vibe
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
            
            <div className="relative w-full max-w-lg bg-white dark:bg-white dark:bg-[#141520] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold text-gray-700 dark:text-gray-300">
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
