import React from 'react'
import { Card } from '@/components/ui/Card'
import { TimelineItem } from '../types/creative-room.types'

interface TimelineFeedProps {
  timelineItems: TimelineItem[]
}

export default function TimelineFeed({ timelineItems }: TimelineFeedProps) {
  return (
    <Card className="p-6 space-y-4">
      <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
        Workspace Historical Timeline
      </span>
      
      {timelineItems.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No workspace history logged.</p>
      ) : (
        <div className="space-y-3.5 max-h-96 overflow-y-auto scrollbar-thin relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-black/5 dark:before:bg-white/5 pt-1">
          {timelineItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className="flex gap-4 relative animate-fadeIn">
                <div className="h-6 w-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 z-10 bg-[#fefdfb] dark:bg-[#1a142a]">
                  <Icon className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div className="space-y-0.5 mt-0.5 flex-1 min-w-0">
                  <h4 className="text-[11px] font-black text-gray-800 dark:text-gray-200 lowercase">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
                    {item.description}
                  </p>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-bold">
                    {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
