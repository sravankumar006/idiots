'use client'

import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`max-w-6xl mx-auto space-y-6 animate-fadeIn ${className}`}>
      {children}
    </div>
  )
}
