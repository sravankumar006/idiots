'use client'

import React from 'react'

export default function ChatTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-slideInRight h-full w-full">
      {children}
    </div>
  )
}
