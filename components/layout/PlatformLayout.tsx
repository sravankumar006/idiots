'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X, ShieldAlert, Clock } from 'lucide-react'
import { UserProfile, StudyRoomTimer } from '@/types'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import RightPanel from './RightPanel'
import MobileNav from './MobileNav'
import useVisualViewport from '@/hooks/useVisualViewport'
import { PushNotificationProvider } from '@/hooks/usePushNotifications'



interface PlatformLayoutProps {
  profile: UserProfile
  children: React.ReactNode
}

export default function PlatformLayout({ profile, children }: PlatformLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  useVisualViewport()

  const [activeSession, setActiveSession] = useState<{ id: string; group_id: string } | null>(null)
  const [activeRoomName, setActiveRoomName] = useState<string>('')
  const [roomTimer, setRoomTimer] = useState<StudyRoomTimer | null>(null)

  // Fetch active session and its room info
  const fetchActiveSession = async () => {
    try {
      const { data: session } = await supabase
        .from('focus_sessions')
        .select('id, group_id, completed')
        .eq('user_id', profile.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (session && session.group_id) {
        setActiveSession({ id: session.id, group_id: session.group_id })
        
        // Fetch room name
        const { data: room } = await supabase
          .from('study_rooms')
          .select('name')
          .eq('id', session.group_id)
          .maybeSingle()
        if (room) {
          setActiveRoomName(room.name)
        }

        // Fetch timer state
        const { data: timer } = await supabase
          .from('study_room_timers')
          .select('*')
          .eq('room_id', session.group_id)
          .maybeSingle()
        setRoomTimer(timer as StudyRoomTimer | null)
      } else {
        setActiveSession(null)
        setActiveRoomName('')
        setRoomTimer(null)
      }
    } catch (err) {
      console.warn("Error fetching active focus session for pill:", err)
    }
  }

  // Subscribe to focus session changes
  useEffect(() => {
    fetchActiveSession()

    const sessionsChannel = supabase.channel(`global-sessions-listener:${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${profile.id}` },
        () => {
          fetchActiveSession()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sessionsChannel)
    }
  }, [profile.id])

  // Subscribe to active room's timer changes
  useEffect(() => {
    if (!activeSession?.group_id) {
      setRoomTimer(null)
      return
    }

    const fetchTimerOnly = async () => {
      const { data } = await supabase
        .from('study_room_timers')
        .select('*')
        .eq('room_id', activeSession.group_id)
        .maybeSingle()
      setRoomTimer(data as StudyRoomTimer | null)
    }

    const timerChannel = supabase.channel(`global-timer-listener:${activeSession.group_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_timers', filter: `room_id=eq.${activeSession.group_id}` },
        () => {
          fetchTimerOnly()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(timerChannel)
    }
  }, [activeSession?.group_id])

  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [isFocusLocked, setIsFocusLocked] = useState(false)
  const [checkingFocus, setCheckingFocus] = useState(true)

  const [isNavigating, setIsNavigating] = useState(false)

  // Listen for global link clicks to detect pending navigations on the initial page
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      
      if (anchor) {
        const href = anchor.getAttribute('href')
        const targetAttr = anchor.getAttribute('target')
        
        // Only trigger on internal route changes that aren't page anchors or target="_blank"
        if (
          href && 
          href.startsWith('/') && 
          !href.startsWith('/#') && 
          href !== pathname && 
          targetAttr !== '_blank'
        ) {
          setIsNavigating(true)
        }
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => {
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [pathname])

  // Reset loader when pathname updates (navigation completes)
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  useEffect(() => {
    if (
      pathname === '/chat' ||
      pathname === '/focus' ||
      pathname?.startsWith('/focus/')
    ) {
      setIsFocusLocked(false)
      setCheckingFocus(false)
      return
    }

    const checkFocusActive = async () => {
      try {
        const { data: activeSession } = await supabase
          .from('focus_sessions')
          .select('id, created_at, group_id')
          .eq('user_id', profile.id)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (activeSession) {
          const createdAtTime = new Date(activeSession.created_at).getTime()
          const nowTime = Date.now()
          const hoursDiff = (nowTime - createdAtTime) / (1000 * 60 * 60)
          
          if (hoursDiff < 4) {
            setIsFocusLocked(true)
            if (activeSession.group_id) {
              router.replace(`/focus/${activeSession.group_id}`)
            } else {
              router.replace('/focus')
            }
            return
          }
        }
        setIsFocusLocked(false)
      } catch (err) {
        console.warn("Layout focus check failed:", err)
      } finally {
        setCheckingFocus(false)
      }
    }

    checkFocusActive()
  }, [pathname, profile.id, router, supabase])

  // Derived display values — computed before any early returns to satisfy Rules of Hooks
  const isCurrentlyInRoom = activeSession?.group_id
    ? pathname === `/focus/${activeSession.group_id}`
    : false

  const showFloatingPill =
    !!activeSession && !isCurrentlyInRoom && !!roomTimer && roomTimer.status !== 'idle'

  // While checking focus, show a blank loader screen to prevent visual content flashes of chat/us
  if (checkingFocus && pathname !== '/focus' && !pathname?.startsWith('/focus/')) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neo-bg transition-colors duration-300">
        <div className="relative flex items-center justify-center p-8 rounded-full bg-neo-bg shadow-neo select-none">
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 100 100" 
            className="select-none"
          >
            <defs>
              <linearGradient id="tg-outer-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--active-color)" />
                <stop offset="100%" stopColor="var(--accent-warm)" />
              </linearGradient>
              <linearGradient id="tg-inner-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-cool)" />
                <stop offset="100%" stopColor="var(--active-color)" />
              </linearGradient>
            </defs>

            <g className="animate-spin" style={{ transformOrigin: '50px 50px' }}>
              {/* Outer triangle solid base */}
              <polygon 
                points="50,10 84.64,70 15.36,70" 
                fill="url(#tg-outer-focus)"
              />

              {/* Outer highlights & shadows */}
              {/* Top-Left Highlight (White/Light) */}
              <line 
                x1="15.36" y1="70" x2="50" y2="10" 
                stroke="rgba(255, 255, 255, 0.65)" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
              {/* Top-Right Shadow (Dark) */}
              <line 
                x1="50" y1="10" x2="84.64" y2="70" 
                stroke="rgba(0, 0, 0, 0.25)" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
              {/* Bottom Shadow (Dark) */}
              <line 
                x1="15.36" y1="70" x2="84.64" y2="70" 
                stroke="rgba(0, 0, 0, 0.25)" 
                strokeWidth="3" 
                strokeLinecap="round"
              />

              {/* Inner recessed (inset) triangle base */}
              <polygon 
                points="50,30 67.32,60 32.68,60" 
                fill="url(#tg-inner-focus)"
              />

              {/* Inner highlights & shadows (reversed for inset effect) */}
              {/* Inner Top-Left Shadow (Dark) */}
              <line 
                x1="32.68" y1="60" x2="50" y2="30" 
                stroke="rgba(0, 0, 0, 0.3)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              {/* Inner Top-Right Highlight (Light) */}
              <line 
                x1="50" y1="30" x2="67.32" y2="60" 
                stroke="rgba(255, 255, 255, 0.3)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              {/* Inner Bottom Highlight (Light) */}
              <line 
                x1="32.68" y1="60" x2="67.32" y2="60" 
                stroke="rgba(255, 255, 255, 0.3)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>
        <p className="mt-6 text-[10px] font-black tracking-widest text-neo-secondary uppercase leading-none select-none animate-pulse">
          establishing secure node connections
        </p>
      </div>
    )
  }

  // If focus mode is active, display locking overlay
  if (isFocusLocked && pathname !== '/focus' && !pathname?.startsWith('/focus/')) {
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center bg-[#0a0b10] text-foreground font-sans p-6 select-none">
        <div className="absolute inset-0 bg-radial from-amber-500/5 to-transparent blur-3xl pointer-events-none animate-pulse" />
        <div className="relative z-10 w-full max-w-sm bg-white/2 border border-white/5 p-8 rounded-3xl backdrop-blur-xl text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
            <ShieldAlert className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">space access restricted</span>
            <h3 className="text-base font-extrabold text-white lowercase">active focus session</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-2.5">
              Access to chat lounge, us pages, and dashboard is restricted until you end or complete your current focus session.
            </p>
          </div>
          <button
            onClick={() => router.replace('/focus')}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/10"
          >
            Return to Focus Deck
          </button>
        </div>
      </div>
    )
  }



  const isMinimalLayout = 
    pathname === '/chat' || 
    (pathname?.startsWith('/focus/') && pathname !== '/focus')

  const renderLayoutContent = () => {
    if (isMinimalLayout) {
      return (
        <div 
          className="relative flex bg-background text-foreground overflow-hidden font-sans transition-colors duration-300 w-full"
          style={{ height: 'var(--visual-viewport-height, 100dvh)' }}
        >
          <main className="flex-1 overflow-hidden relative min-w-0 h-full">
            {children}
          </main>
        </div>
      )
    }

    return (
      <div 
        className="relative flex bg-background text-foreground overflow-hidden font-sans transition-colors duration-300 w-full"
        style={{ height: 'var(--visual-viewport-height, 100dvh)' }}
      >
        {/* 1. Desktop & Tablet Sidebar */}
        <div className="hidden md:flex h-full shrink-0">
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed} 
            profile={profile}
          />
        </div>

        {/* 3. Main Workspace Container */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          
          {/* Content & Right Panel Viewport */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Core Page Content area */}
            <main className="flex-1 overflow-y-auto px-4 py-6 md:p-6 pb-6 min-w-0 mb-[calc(3rem+env(safe-area-inset-bottom,0px))] md:mb-0">
              {/* Top Header Bar */}
              <div id="topbar-container" className="shrink-0 z-40 bg-transparent relative mb-6 md:mb-8 -mt-6 -mx-4 md:-mt-6 md:-mx-6">
                <Topbar 
                  profile={profile} 
                  rightPanelOpen={isRightPanelOpen} 
                  setRightPanelOpen={setIsRightPanelOpen} 
                  onToggleMobileMenu={() => setMobileMenuOpen(true)}
                />
              </div>
              {children}
            </main>

            {/* Optional Right Panel (Desktop/Tablet inspect sidebar) */}
            <RightPanel 
              profile={profile} 
              isOpen={isRightPanelOpen} 
            />

          </div>

          {/* Mobile Bottom Tab Navbar */}
          <MobileNav profile={profile} drawerOpen={mobileMenuOpen} setDrawerOpen={setMobileMenuOpen} />

        </div>

      </div>
    )
  }

  return (
    <PushNotificationProvider userId={profile.id}>
      {isNavigating && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 bg-white/95 dark:bg-[#181922]/95 backdrop-blur-md shadow-neo-high rounded-full border border-white/40 dark:border-white/5 flex items-center gap-2.5 animate-fadeIn select-none">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 100 100" 
            className="select-none"
          >
            <defs>
              <linearGradient id="tg-outer-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5E4545" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="tg-inner-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5b21b6" />
                <stop offset="100%" stopColor="#5E4545" />
              </linearGradient>
            </defs>

            <g className="animate-spin" style={{ transformOrigin: '50px 50px' }}>
              {/* Outer triangle base */}
              <polygon 
                points="50,10 84.64,70 15.36,70" 
                fill="url(#tg-outer-nav)"
              />
              {/* Outer highlights & shadows */}
              <line x1="15.36" y1="70" x2="50" y2="10" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="3" strokeLinecap="round" />
              <line x1="50" y1="10" x2="84.64" y2="70" stroke="rgba(0, 0, 0, 0.25)" strokeWidth="3" strokeLinecap="round" />
              <line x1="15.36" y1="70" x2="84.64" y2="70" stroke="rgba(0, 0, 0, 0.25)" strokeWidth="3" strokeLinecap="round" />
              
              {/* Inner recessed (inset) triangle base */}
              <polygon points="50,30 67.32,60 32.68,60" fill="url(#tg-inner-nav)" />
              <line x1="32.68" y1="60" x2="50" y2="30" stroke="rgba(0, 0, 0, 0.3)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="50" y1="30" x2="67.32" y2="60" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="32.68" y1="60" x2="67.32" y2="60" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
          <span className="text-[9px] font-black tracking-widest text-[#5E4545] dark:text-violet-400 uppercase">
            syncing...
          </span>
        </div>
      )}
      {renderLayoutContent()}
      {showFloatingPill && (
        <FloatingSessionPill
          roomName={activeRoomName}
          timer={roomTimer}
          roomId={activeSession!.group_id}
        />
      )}
    </PushNotificationProvider>
  )
}

interface FloatingSessionPillProps {
  roomName: string
  timer: StudyRoomTimer | null
  roomId: string
}

function FloatingSessionPill({ roomName, timer, roomId }: FloatingSessionPillProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, hasMoved: false })

  useEffect(() => {
    setMounted(true)
    setPosition({ x: window.innerWidth - 240, y: 80 })
  }, [])

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const isNoTimer = timer ? timer.duration_minutes === 0 : false

  useEffect(() => {
    if (!timer) return

    if (timer.status === 'idle') {
      setIsActive(false)
      setElapsedSeconds(0)
      return
    }

    if (timer.status === 'paused') {
      setIsActive(false)
      setElapsedSeconds(timer.elapsed_seconds)
      return
    }

    if (timer.status === 'completed') {
      setIsActive(false)
      setElapsedSeconds(timer.duration_minutes * 60)
      return
    }

    if (timer.status === 'running') {
      setIsActive(true)

      const calculateSeconds = () => {
        if (!timer.start_time) return timer.elapsed_seconds
        const startMs = new Date(timer.start_time).getTime()
        const nowMs = Date.now()
        const diffSecs = Math.floor((nowMs - startMs) / 1000)
        return timer.elapsed_seconds + diffSecs
      }

      setElapsedSeconds(calculateSeconds())

      const interval = setInterval(() => {
        setElapsedSeconds(calculateSeconds())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [timer])

  if (!mounted) return null

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const remainingSeconds = isNoTimer ? elapsedSeconds : Math.max(0, ((timer?.duration_minutes || 0) * 60) - elapsedSeconds)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
      hasMoved: false
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.hasMoved = true
    }
    const newX = Math.max(10, Math.min(window.innerWidth - 230, dragRef.current.posX + dx))
    const newY = Math.max(10, Math.min(window.innerHeight - 70, dragRef.current.posY + dy))
    setPosition({ x: newX, y: newY })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    
    if (!dragRef.current.hasMoved) {
      router.push(`/focus/${roomId}`)
    }
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
        zIndex: 99999
      }}
      className="flex items-center gap-3 w-[220px] h-14 pl-3.5 pr-4 rounded-2xl bg-white/75 dark:bg-black/70 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-neo hover:shadow-neo-shallow active:scale-95 transition-transform select-none cursor-grab active:cursor-grabbing"
    >
      <div className="relative shrink-0 flex items-center justify-center w-7.5 h-7.5 rounded-xl bg-amber-500/10 text-amber-500">
        <Clock className={`h-4.5 w-4.5 ${isActive ? 'animate-pulse' : ''}`} />
        {isActive && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        )}
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 lowercase truncate leading-none mb-0.5">
          {roomName}
        </div>
        <div className="text-sm font-black font-mono text-gray-850 dark:text-white leading-none">
          {formatTime(remainingSeconds)}
        </div>
      </div>

      <div className="flex items-center shrink-0">
        <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
      </div>
    </div>
  )
}
