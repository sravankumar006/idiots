'use client'

import React from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export default function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/5 dark:border-white/5 select-none">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-wide uppercase">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold tracking-wide">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
