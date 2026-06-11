'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Sparkles, Brain, Clock } from 'lucide-react'

export default function TimelineSkeleton() {
  return (
    <div className="relative max-w-4xl mx-auto mt-6 px-4 md:px-0 w-full animate-pulse" role="status" aria-label="loading timeline">
      {/* Central timeline alignment axis bar */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-violet-500/10 via-rose-500/10 to-amber-500/5" />

      <div className="space-y-12">
        {[1, 2, 3, 4].map((i) => {
          const isLeft = i % 2 === 0

          return (
            <div 
              key={i} 
              className={`relative flex flex-col md:flex-row items-stretch ${
                isLeft ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Timeline Node Point (Glow Circle) Skeleton */}
              <div className="absolute left-6 md:left-1/2 -translate-x-[11px] md:-translate-x-1/2 top-4 z-10">
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/5">
                  <div className="h-3 w-3 rounded-full bg-black/10 dark:bg-white/10" />
                </div>
              </div>

              {/* Spacer for desktop alignment */}
              <div className="hidden md:block w-1/2" />

              {/* Card Content Skeleton */}
              <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isLeft ? 'md:pr-10' : 'md:pl-10'}`}>
                <Card className="p-5 relative bg-white/3 border-white/5 backdrop-blur-xl shadow-xl">
                  {/* Card Header metadata */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-3 w-20 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                    <div className="h-3 w-24 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                  </div>

                  {/* Title */}
                  <div className="h-5 w-3/4 bg-black/[0.06] dark:bg-white/[0.06] rounded mb-3" />

                  {/* Description lines */}
                  <div className="space-y-2 mt-2">
                    <div className="h-3 w-full bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                    <div className="h-3 w-5/6 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                    <div className="h-3 w-4/6 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                  </div>

                  {/* Optional Image placeholder for alternating items */}
                  {i % 3 === 0 && (
                    <div className="mt-4 h-40 w-full bg-black/[0.03] dark:bg-white/[0.03] rounded-xl border border-black/5 dark:border-white/5" />
                  )}

                  {/* Footer - logged user + hearts */}
                  <div className="mt-5 pt-3.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-black/[0.04] dark:bg-white/[0.04]" />
                      <div className="h-3 w-16 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                    </div>
                    <div className="h-6 w-10 bg-black/[0.04] dark:bg-white/[0.04] rounded-lg" />
                  </div>
                </Card>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
