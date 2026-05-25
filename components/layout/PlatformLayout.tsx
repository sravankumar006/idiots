'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { UserProfile } from '@/types'
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        />
      </div>

      {/* 2. Mobile Slide-out Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar container */}
          <div className="relative w-64 h-full bg-[#faf9f6] dark:bg-[#16181d] border-r border-black/5 dark:border-white/10 flex flex-col z-10 animate-slideRight">
            {/* Header close trigger */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center text-[10px] font-black text-black">
                  IS
                </div>
                <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-white uppercase">Idiots Space</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Render Sidebar components directly */}
            <div className="flex-1 overflow-y-auto px-3 py-4" onClick={() => setMobileMenuOpen(false)}>
              <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
            </div>
          </div>
        </div>
      )}

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
        <MobileNav />

      </div>

    </div>
  )
}
