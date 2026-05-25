'use client'

import React from 'react'

export default function MessageSkeleton() {
  return (
    <div 
      className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 select-none animate-pulse" 
      role="status" 
      aria-live="polite"
      aria-label="loading messages..."
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const isLeft = i % 2 !== 0
        // Alternate widths for realistic feel
        const widths = ['w-48', 'w-64', 'w-56', 'w-72', 'w-40']
        const bubbleWidth = widths[i % widths.length]

        return (
          <div key={i} className={`flex gap-3 max-w-[75%] ${isLeft ? '' : 'ml-auto flex-row-reverse'}`}>
            {/* Avatar skeleton */}
            <div className="h-8 w-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 shrink-0" />
            
            {/* Message skeleton container */}
            <div className={`space-y-1 flex-1 ${isLeft ? '' : 'flex flex-col items-end'}`}>
              <div className="flex gap-2 items-baseline">
                <div className="h-2.5 w-16 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                <div className="h-2 w-8 bg-black/[0.03] dark:bg-white/[0.03] rounded" />
              </div>
              <div className={`h-10 ${bubbleWidth} bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl ${
                isLeft ? 'rounded-tl-none' : 'rounded-tr-none'
              }`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
