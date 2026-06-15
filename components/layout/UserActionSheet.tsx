'use client'

import React, { useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { Home, Settings, LogOut, X } from 'lucide-react'
import { UserProfile } from '@/types'
import { logout } from '@/app/auth/actions'

interface UserActionSheetProps {
  profile: UserProfile
  onClose: () => void
}

export default function UserActionSheet({ profile, onClose }: UserActionSheetProps) {
  const [isLoggingOut, startLogoutTransition] = useTransition()

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleLogoutClick = () => {
    startLogoutTransition(async () => {
      await logout()
      onClose()
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fadeIn md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="User quick actions"
        className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp md:hidden select-none"
      >
        <div 
          className="bg-[#faf9f6] dark:bg-[#16181d] rounded-t-3xl border-t border-black/5 dark:border-white/10 shadow-2xl overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Drag Handle indicator */}
          <div className="flex justify-center pt-3.5 pb-1">
            <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-logo-start to-logo-end flex items-center justify-center text-[10px] font-black text-black">
                IS
              </div>
              <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-white uppercase">
                @{profile.username}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Options */}
          <div className="px-4 py-2 space-y-1">
            {/* My Corner */}
            <Link
              href={`/space/${profile.username || 'me'}`}
              onClick={onClose}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white transition-all min-h-[50px]"
            >
              <Home className="h-5 w-5 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="lowercase">My Corner</span>
                <span className="block text-[10px] text-gray-400 dark:text-gray-500 lowercase mt-0.5">your private study & project stats</span>
              </div>
            </Link>

            {/* Preferences / Settings */}
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white transition-all min-h-[50px]"
            >
              <Settings className="h-5 w-5 text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="lowercase">Preferences & settings</span>
                <span className="block text-[10px] text-gray-400 dark:text-gray-500 lowercase mt-0.5">configure models, notifications & theme</span>
              </div>
            </Link>

            {/* Logout Action */}
            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-sm font-semibold text-red-500 dark:text-red-400 transition-all min-h-[50px] cursor-pointer disabled:opacity-50 text-left"
            >
              <LogOut className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="lowercase">{isLoggingOut ? 'disconnecting...' : 'sign out'}</span>
                <span className="block text-[10px] text-red-400/70 lowercase mt-0.5">terminate active secure session</span>
              </div>
            </button>
          </div>

          {/* Cancel button */}
          <div className="px-4 pb-6 pt-3">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black/[0.04] dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer min-h-[48px]"
            >
              cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
