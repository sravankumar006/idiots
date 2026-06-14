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
    { href: '/dashboard', label: 'home', icon: LayoutDashboard },
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
        className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ease-out relative group cursor-pointer ${
          isSubItem ? 'pl-8' : ''
        } ${
          isActive 
            ? 'text-violet-600 dark:text-violet-400 bg-violet-500/5 dark:bg-violet-500/10' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-105 ${
          isActive ? 'text-violet-500 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-violet-600 dark:group-hover:text-violet-300'
        }`} />
        
        {!isCollapsed && (
          <span className="animate-fadeIn truncate">{item.label}</span>
        )}

        {isCollapsed && (
          <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 z-50 py-1.5 px-3 rounded-lg bg-[#faf9f6] dark:bg-[#141520] border border-black/5 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-white whitespace-nowrap shadow-lg">
            {item.label}
          </div>
        )}
      </Link>
    )
  }

  return (
    <aside 
      className={`flex flex-col h-full bg-[#faf9f6] dark:bg-[#141520] border-r border-black/5 dark:border-white/5 transition-all duration-500 ease-in-out select-none shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Branding */}
      <div className={`flex items-center h-16 px-5 border-b border-black/5 dark:border-white/5 ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 animate-fadeIn">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-logo-start to-logo-end flex items-center justify-center shadow-md">
              <span className="text-black font-extrabold text-[10px]">IS</span>
            </div>
            <span className="font-extrabold tracking-wider text-xs logo-gradient lowercase">
              idiots space
            </span>
          </div>
        )}
        {isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8 rounded-xl bg-gradient-to-tr from-logo-start to-logo-end flex items-center justify-center shadow-md hover:from-violet-500 hover:to-pink-400 group transition-all duration-300 cursor-pointer border-none"
            title="Expand Sidebar"
            suppressHydrationWarning
          >
            <span className="text-black font-extrabold text-xs group-hover:hidden">IS</span>
            <ChevronRight className="h-4 w-4 text-black hidden group-hover:block" />
          </button>
        )}

        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white transition-all cursor-pointer"
            title="Collapse Sidebar"
            suppressHydrationWarning
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-none">
        
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
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer ${
                  pathname.startsWith('/us')
                    ? 'text-violet-600 dark:text-violet-400 bg-violet-500/5 dark:bg-violet-500/5'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/3 dark:hover:bg-white/3'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className={`h-4.5 w-4.5 ${pathname.startsWith('/us') ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className="lowercase">Us</span>
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
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer ${
                  pathname.startsWith('/growth')
                    ? 'text-violet-600 dark:text-violet-400 bg-violet-500/5 dark:bg-violet-500/5'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/3 dark:hover:bg-white/3'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className={`h-4.5 w-4.5 ${pathname.startsWith('/growth') ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className="lowercase">Growth</span>
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

        <div className="border-t border-black/5 dark:border-white/5 my-4" />

        {/* Settings */}
        {renderLink({ href: '/settings', label: 'settings', icon: Settings })}
      </nav>

      {/* Collapse / Expand Switcher */}
      <div className="p-3 border-t border-black/5 dark:border-white/5">
        {isCollapsed ? (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="w-full py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
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
