'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X, ShieldAlert } from 'lucide-react'
import { UserProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import RightPanel from './RightPanel'
import MobileNav from './MobileNav'

interface PlatformLayoutProps {
  profile: UserProfile
  children: React.ReactNode
}

export default function PlatformLayout({ profile, children }: PlatformLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [isFocusLocked, setIsFocusLocked] = useState(false)
  const [checkingFocus, setCheckingFocus] = useState(true)

  useEffect(() => {
    if (pathname === '/growth/focus') {
      setIsFocusLocked(false)
      setCheckingFocus(false)
      return
    }

    const checkFocusActive = async () => {
      try {
        const { data: activeSession } = await supabase
          .from('focus_sessions')
          .select('id, created_at')
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
            router.replace('/growth/focus')
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

  // While checking focus, show a blank loader screen to prevent visual content flashes of chat/us
  if (checkingFocus && pathname !== '/growth/focus') {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-background text-foreground">
        <div className="h-6 w-6 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
      </div>
    )
  }

  // If focus mode is active, display locking overlay
  if (isFocusLocked && pathname !== '/growth/focus') {
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
            onClick={() => router.replace('/growth/focus')}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/10"
          >
            Return to Focus Deck
          </button>
        </div>
      </div>
    )
  }

  const isChatPage = pathname === '/chat'

  // Standard full-screen layout for chat (2-column Telegram split style)
  if (isChatPage) {
    return (
      <div className="relative h-full flex bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">
        <main className="flex-1 overflow-hidden relative min-w-0">
          {children}
        </main>
      </div>
    )
  }

  // General layout for dashboard, settings, and other pages
  return (
    <div className="relative h-full flex bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">
      
      {/* 1. Desktop & Tablet Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
          profile={profile}
        />
      </div>



      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header Bar */}
        <Topbar 
          profile={profile} 
          rightPanelOpen={isRightPanelOpen} 
          setRightPanelOpen={setIsRightPanelOpen} 
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Content & Right Panel Viewport */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Core Page Content area */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:p-6 pb-24 md:pb-6 relative min-w-0">
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
