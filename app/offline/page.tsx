'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, LayoutDashboard } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  // Listen to browser network changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Auto reconnect/redirect if browser becomes online
      router.refresh()
      router.push('/dashboard')
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const handleRetry = async () => {
    setIsChecking(true)
    // Simulate brief checker delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    if (navigator.onLine) {
      setIsOnline(true)
      router.refresh()
      router.push('/dashboard')
    } else {
      setIsChecking(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 bg-background text-foreground transition-all duration-300">
      {/* Background radial glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 45%, var(--accent-warm) 0%, transparent 55%)'
        }}
      />

      <div className="relative z-10 glass-panel max-w-md w-full p-8 rounded-2xl shadow-neo flex flex-col items-center text-center space-y-6">
        {/* Animated Icon Container */}
        <div className="h-16 w-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shadow-neo-inset relative">
          <WifiOff className="h-8 w-8 text-rose-400 dark:text-rose-500 animate-pulse" />
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-rose-500 border-2 border-neo-bg shadow-sm" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-primary-text lowercase">
            you are offline
          </h1>
          <p className="text-xs text-secondary-text leading-relaxed">
            the crew is still here, but we can't reach the workspace without an active connection. your messages are queued and will sync automatically when you reconnect.
          </p>
        </div>

        {/* Buttons / Controls */}
        <div className="w-full pt-2 space-y-3">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full glass-button py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'checking connection...' : 'retry connection'}
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 rounded-xl border border-black/8 dark:border-white/8 text-[11px] font-medium text-secondary-text hover:text-primary-text hover:bg-black/3 dark:hover:bg-white/3 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            return to dashboard
          </button>
        </div>

        {/* Sync status */}
        <div className="text-[10px] text-neo-muted lowercase italic">
          {isOnline ? 'connection detected! redirecting...' : 'waiting for internet connection...'}
        </div>
      </div>
    </div>
  )
}
