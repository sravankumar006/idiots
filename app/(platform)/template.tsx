'use client'

import React from 'react'

export default function PlatformTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-pageFadeIn h-full w-full">
      {children}
    </div>
  )
}
