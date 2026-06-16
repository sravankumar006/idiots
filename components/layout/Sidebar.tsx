'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  Brain, 
  FolderHeart, 
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  History,
  Archive,
  Users,
  Compass
} from 'lucide-react'
import { UserProfile } from '@/types'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  profile?: UserProfile
}

export default function Sidebar({ isCollapsed, setIsCollapsed, profile }: SidebarProps) {
  const pathname = usePathname()
  
  // Collapsible states
  const [usExpanded, setUsExpanded] = useState(false)
  const [growthExpanded, setGrowthExpanded] = useState(false)

  // Auto-expand sections based on the current active route
  useEffect(() => {
    if (pathname.startsWith('/us')) {
      setUsExpanded(true)
    }
    if (pathname.startsWith('/growth')) {
      setGrowthExpanded(true)
    }
  }, [pathname])

  const mainNavItems = [
    { href: '/dashboard', label: 'home', icon: Home },
    { href: '/chat', label: 'chat lounge', icon: MessageSquare },
    { href: '/ai', label: 'companion', icon: Sparkles },
    { href: `/space/${profile?.username || 'me'}`, label: 'my corner', icon: Home },
  ]

  const usSubItems = [
    { href: '/us/timeline', label: 'timeline', icon: History },
    { href: '/us/vault', label: 'scrapbook vault', icon: Archive },
  ]

  const growthSubItems = [
    { href: '/growth/focus', label: 'zen focus', icon: Clock },
    { href: '/growth/creative', label: 'creative room', icon: FolderHeart },
    { href: '/growth/memories', label: 'memories', icon: Brain },
  ]

  // Render a single navigation link
  const renderLink = (item: { href: string; label: string; icon: any }, isSubItem = false) => {
    const Icon = item.icon
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3.5 py-3.5 px-4 font-bold lowercase tracking-wide text-xs transition-all duration-300 ${
          isSubItem ? 'pl-8' : ''
        } ${
          isActive 
            ? 'bg-neo-bg shadow-neo-inset text-[#fb864b] font-bold rounded-full dark:text-shadow-[0_0_8px_rgba(124,58,237,0.4)]' 
            : 'bg-transparent text-neo-secondary rounded-full hover:bg-neo-bg hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5'
        }`}
      >
        <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-105 ${
          isActive ? 'text-[#fb864b]' : 'text-gray-400 dark:text-gray-500 group-hover:text-violet-600 dark:group-hover:text-violet-300'
        }`} />
        
        {!isCollapsed && (
          <span className="animate-fadeIn truncate leading-none mt-0.5">{item.label}</span>
        )}

        {isCollapsed && (
          <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 z-50 py-1.5 px-3 rounded-lg bg-neo-bg shadow-neo text-xs font-bold text-neo-text whitespace-nowrap border-none">
            {item.label}
          </div>
        )}
      </Link>
    )
  }

  return (
    <aside 
      className={`flex flex-col h-[calc(100vh-2rem)] m-4 rounded-[24px] bg-neo-bg shadow-neo transition-all duration-500 ease-in-out select-none shrink-0 border-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Branding Plate (Deeply recessed with small floating orb) */}
      <div className={`flex items-center h-20 px-4 border-none ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!isCollapsed && (
          <div className="w-full bg-neo-bg shadow-neo-inset px-4 py-2 rounded-full flex items-center justify-between gap-3 transition-all duration-300">
            <div className="flex items-center gap-2.5 animate-fadeIn">
              <div className="h-8 w-8 rounded-full bg-neo-bg shadow-neo flex items-center justify-center text-[#fb864b] font-extrabold text-[10px] hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all duration-300 cursor-pointer">
                is
              </div>
              <span className="font-extrabold tracking-wider text-xs text-neo-secondary lowercase leading-none mt-0.5">
                idiots space
              </span>
            </div>
            
            <button 
              onClick={() => setIsCollapsed(true)}
              className="w-7 h-7 rounded-full bg-neo-bg shadow-neo flex items-center justify-center text-neo-secondary hover:text-[#fb864b] hover:shadow-neo active:shadow-neo-inset transition-all duration-300 cursor-pointer border-none"
              title="Collapse Sidebar"
              suppressHydrationWarning
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="h-10 w-10 rounded-full bg-neo-bg shadow-neo flex items-center justify-center text-[#fb864b] hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all duration-300 cursor-pointer border-none"
            title="Expand Sidebar"
            suppressHydrationWarning
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2.5 overflow-y-auto scrollbar-none border-none">
        
        {/* Main Items */}
        {mainNavItems.map(item => renderLink(item))}

        {/* Us Group Section */}
        <div className="space-y-1">
          {isCollapsed ? (
            renderLink({ href: '/us', label: 'us hub', icon: Users })
          ) : (
            <>
              <button
                onClick={() => setUsExpanded(!usExpanded)}
                suppressHydrationWarning
                className={`w-full flex items-center justify-between py-3.5 px-4 font-bold text-xs transition-all duration-300 ease-out cursor-pointer ${
                  pathname.startsWith('/us')
                    ? 'bg-neo-bg shadow-neo-inset text-[#fb864b] font-bold rounded-full'
                    : 'bg-transparent text-neo-secondary rounded-full hover:bg-neo-bg hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Users className={`h-4.5 w-4.5 ${pathname.startsWith('/us') ? 'text-[#fb864b]' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className="lowercase leading-none mt-0.5">Us</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${usExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Us Submenus */}
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden space-y-1 pl-1 ${
                  usExpanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                {usSubItems.map(item => renderLink(item, true))}
              </div>
            </>
          )}
        </div>

        {/* Growth Group Section */}
        <div className="space-y-1">
          {isCollapsed ? (
            renderLink({ href: '/growth', label: 'growth dashboard', icon: Compass })
          ) : (
            <>
              <button
                onClick={() => setGrowthExpanded(!growthExpanded)}
                suppressHydrationWarning
                className={`w-full flex items-center justify-between py-3.5 px-4 font-bold text-xs transition-all duration-300 ease-out cursor-pointer ${
                  pathname.startsWith('/growth')
                    ? 'bg-neo-bg shadow-neo-inset text-[#fb864b] font-bold rounded-full'
                    : 'bg-transparent text-neo-secondary rounded-full hover:bg-neo-bg hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Compass className={`h-4.5 w-4.5 ${pathname.startsWith('/growth') ? 'text-[#fb864b]' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className="lowercase leading-none mt-0.5">Growth</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${growthExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Growth Submenus */}
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden space-y-1 pl-1 ${
                  growthExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                {growthSubItems.map(item => renderLink(item, true))}
              </div>
            </>
          )}
        </div>

        <div className="my-4" />

        {/* Settings */}
        {renderLink({ href: '/settings', label: 'settings', icon: Settings })}
      </nav>

      {/* Collapse / Expand Switcher */}
      <div className="p-3 border-none">
        {isCollapsed ? (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 mx-auto rounded-full bg-neo-bg shadow-neo flex items-center justify-center text-neo-secondary hover:text-neo-text hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all duration-300 cursor-pointer border-none"
            title="Expand Sidebar"
            suppressHydrationWarning
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <div className="text-center py-2 select-none">
            <span className="text-[10px] text-violet-400/50 font-bold lowercase tracking-wider block">
              idiots space • heartbeat
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
