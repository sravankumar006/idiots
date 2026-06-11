'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Sparkles, Clock } from 'lucide-react'

export default function AiMessageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full animate-pulse" role="status" aria-label="loading ai response">
      {[1, 2].map((i) => (
        <Card key={i} className="p-4 sm:p-6 transition-all border bg-white dark:bg-[#16181d] border-indigo-500/20 shadow-[0_4px_20px_rgba(99,102,241,0.03)]">
          <div className="flex items-start gap-4">
            {/* Avatar Skeleton */}
            <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center text-white shadow-sm bg-indigo-500/20 dark:bg-indigo-500/10 border border-indigo-500/10">
              <Sparkles className="h-5 w-5 text-indigo-500/30" />
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 min-w-0 space-y-4 pt-1">
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-4 w-16 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                <div className="h-3 w-20 bg-black/[0.03] dark:bg-white/[0.03] rounded flex items-center gap-1">
                  <Clock className="h-3 w-3 text-transparent" />
                </div>
              </div>

              {/* Text Blocks */}
              <div className="space-y-2">
                <div className="h-3 w-3/4 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                <div className="h-3 w-full bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                <div className="h-3 w-5/6 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                {i % 2 === 0 && (
                  <div className="h-3 w-1/2 bg-black/[0.04] dark:bg-white/[0.04] rounded mt-2" />
                )}
              </div>
              
              {/* Code block skeleton (optional, occasionally shown) */}
              {i % 2 !== 0 && (
                <div className="h-24 w-full bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl mt-4" />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
