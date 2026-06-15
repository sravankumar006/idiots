'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home,
  MessageSquare, 
  Sparkles, 
  Compass, 
  Users
} from 'lucide-react'
import { UserProfile } from '@/types'

interface MobileNavProps {
  profile?: UserProfile
  drawerOpen?: boolean
  setDrawerOpen?: (open: boolean) => void
}

export default function MobileNav({ profile, drawerOpen, setDrawerOpen }: MobileNavProps) {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard', label: 'home', icon: Home },
    { href: '/chat', label: 'chat lounge', icon: MessageSquare },
    { href: '/ai', label: 'companion', icon: Sparkles },
    { href: '/growth', label: 'career', icon: Compass },
    { href: '/us', label: 'us', icon: Users },
  ]

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf9f6]/90 dark:bg-[#16181d]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/5 px-1 flex items-center justify-around select-none shadow-[0_-2px_16px_rgba(0,0,0,0.06)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(3rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        // Match exact or starts with sub-routes
        const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
        
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200 ease-out ${
              isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            style={{ minHeight: '44px' }}
          >
            <Icon className={`h-[18px] w-[18px] transition-transform active:scale-90 ${isActive ? 'scale-110' : ''}`} />
            <span className="text-[9px] font-semibold lowercase truncate max-w-full tracking-wide">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
