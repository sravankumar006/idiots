'use client'

import React from 'react'

export function BackgroundGlows() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#020205]">
      {/* Radial Gradient Glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-glow-blue/10 blur-[130px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-glow-purple/10 blur-[130px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-glow-cyan/5 blur-[150px] animate-pulse-slow" style={{ animationDelay: '4s' }} />

      {/* Cybernetic Tech Grid Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" 
        style={{ pointerEvents: 'none' }}
      />

      {/* Subtle Dust Particles Effect */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]" />
    </div>
  )
}
