'use client'

import React from 'react'

export function BackgroundGlows() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Radial Gradient Glows */}
      <div className="absolute top-[-10%] right-[-10%] h-[700px] w-[700px] rounded-full bg-[var(--accent-warm)]/4 dark:bg-[var(--accent-warm)]/3 blur-[140px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[700px] w-[700px] rounded-full bg-[var(--accent-cool)]/4 dark:bg-[var(--accent-cool)]/3 blur-[140px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[30%] left-[40%] -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[var(--active-color)]/3 dark:bg-[var(--active-color)]/1.5 blur-[150px] animate-pulse-slow" style={{ animationDelay: '4s' }} />

      {/* Cybernetic Tech Grid Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(138,132,123,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(138,132,123,0.015)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" 
        style={{ pointerEvents: 'none' }}
      />

      {/* Subtle Dust Particles Effect */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(rgba(138,132,123,0.15)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]" />
    </div>
  )
}
