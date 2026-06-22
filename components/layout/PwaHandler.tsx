'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, X, RefreshCw } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function PwaHandler() {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [canReload, setCanReload] = useState(false)
  const { resolvedTheme } = useTheme()

  // Dynamically update status bar theme color to match the current theme background
  useEffect(() => {
    if (typeof document === 'undefined') return
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    const color = resolvedTheme === 'dark' ? '#171614' : '#D8D1C7'
    meta.setAttribute('content', color)
  }, [resolvedTheme])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const handleSWStates = (registration: ServiceWorkerRegistration) => {
      // 1. If there is a waiting worker already on load
      if (registration.waiting) {
        setToastMessage('new workspace update available. reload to activate.')
        setCanReload(true)
        setShowToast(true)
      }

      // 2. Listen for future updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing
        if (!installingWorker) return

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Service Worker updated (controller already existed)
              setToastMessage('new workspace update is ready. reload to activate.')
              setCanReload(true)
              setShowToast(true)
            } else {
              // Service Worker installed for the very first time
              setToastMessage('offline mode is now available. pages are cached.')
              setCanReload(false)
              setShowToast(true)
              
              // Hide automatically after 6 seconds for first install
              setTimeout(() => {
                setShowToast(false)
              }, 6000)
            }
          }
        })
      })
    }

    // Check active registrations
    navigator.serviceWorker.ready
      .then((registration) => {
        handleSWStates(registration)
      })

  }, [])

  if (!showToast) return null

  return (
    <div className="fixed bottom-20 right-6 sm:bottom-6 z-50 animate-slideUp">
      <div className="glass-panel p-4 rounded-xl border border-black/8 dark:border-white/8 shadow-2xl flex items-center gap-3.5 max-w-sm">
        <div className="h-8 w-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary-text lowercase leading-normal pr-2">
            {toastMessage}
          </p>
        </div>
        
        {canReload && (
          <button
            onClick={() => window.location.reload()}
            className="px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[10px] font-bold text-primary-text transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            activate
          </button>
        )}

        <button
          onClick={() => setShowToast(false)}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all cursor-pointer shrink-0"
          aria-label="Close message"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
