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
