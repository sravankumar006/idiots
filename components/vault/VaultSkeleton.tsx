'use client'

import React from 'react'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { Tag, Sparkles } from 'lucide-react'

// Polaroid rotation styles
const ROTATIONS = [
  '-rotate-1',
  'rotate-2',
  '-rotate-2',
  'rotate-1',
  '-rotate-3',
  'rotate-3'
]

export default function VaultSkeleton() {
  return (
    <div className="w-full animate-pulse" role="status" aria-label="loading vault">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 w-64 bg-black/[0.04] dark:bg-white/[0.04] rounded-lg mb-2" />
          <div className="h-4 w-96 max-w-full bg-black/[0.03] dark:bg-white/[0.03] rounded" />
        </div>
        <div className="h-10 w-32 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl shrink-0 mt-2 sm:mt-0" />
      </div>

      {/* Categories Switcher Skeleton */}
      <div className="flex border-b border-black/5 dark:border-white/5 mt-6 mb-6 overflow-x-auto gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 w-24 bg-black/[0.02] dark:bg-white/[0.02] rounded-t-lg shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 columns: Polaroid Scrapbook grid Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls: Search Skeleton */}
          <div className="flex items-center gap-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 p-3.5 rounded-2xl">
            <div className="h-9 w-full bg-black/[0.03] dark:bg-white/[0.03] rounded-xl" />
          </div>

          {/* Polaroid Scrapbook Container Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i, idx) => {
              const rot = ROTATIONS[idx % ROTATIONS.length]
              return (
                <div 
                  key={i}
                  className={`bg-stone-100 dark:bg-zinc-800/80 p-4 pb-6 shadow-xl border border-stone-200/50 dark:border-zinc-700/30 transform ${rot}`}
                  style={{ minHeight: '260px' }}
                >
                  {/* Media frame */}
                  <div className="bg-stone-200 dark:bg-zinc-900/50 border border-stone-300/40 dark:border-zinc-800/40 h-44 rounded-sm flex items-center justify-center relative">
                    <div className="h-12 w-12 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]" />
                  </div>

                  {/* Polaroid Text Area */}
                  <div className="mt-4 space-y-3">
                    <div className="h-5 w-3/4 bg-black/[0.06] dark:bg-white/[0.06] rounded" />
                    
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                      <div className="h-3 w-5/6 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                    </div>

                    {/* Footer tags */}
                    <div className="flex gap-1.5 pt-3">
                      <div className="h-4 w-12 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                      <div className="h-4 w-10 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                      <div className="h-4 w-16 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <div className="h-2 w-16 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                      <div className="h-2 w-12 bg-black/[0.04] dark:bg-white/[0.04] rounded" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column: Tag Cloud & Scrapbook Policy Skeleton */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Tag className="h-4 w-4 text-violet-400/50" />
              vault tags cloud
            </h3>
            
            <div className="flex gap-2 flex-wrap pt-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="py-1 px-2.5 rounded-lg h-6 w-12 bg-black/[0.03] dark:bg-white/[0.03]" style={{ width: `${Math.random() * 40 + 40}px` }} />
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-3 bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400/50" />
              about memory vault
            </h3>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-black/[0.03] dark:bg-white/[0.03] rounded" />
              <div className="h-2.5 w-full bg-black/[0.03] dark:bg-white/[0.03] rounded" />
              <div className="h-2.5 w-3/4 bg-black/[0.03] dark:bg-white/[0.03] rounded" />
              <div className="h-2.5 w-5/6 bg-black/[0.03] dark:bg-white/[0.03] rounded mt-2" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
