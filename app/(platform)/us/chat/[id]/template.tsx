'use client'

import React, { use } from 'react'

interface ChatTemplateProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default function ChatTemplate({ children, params }: ChatTemplateProps) {
  const resolvedParams = use(params)
  return (
    <div className="animate-slideInRight h-full w-full">
      {children}
    </div>
  )
}
