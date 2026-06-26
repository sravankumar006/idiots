import React from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatRelativeTime } from '../utils/space-profile.utils'

interface RecentActivityFeedProps {
  combinedActivities: any[]
  loadingActivities: boolean
}

export default function RecentActivityFeed({ combinedActivities, loadingActivities }: RecentActivityFeedProps) {
  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-rose-400" />
        Recent Activity
      </h3>

      {loadingActivities ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 text-rose-500 animate-spin" />
          <span className="text-[10px] text-gray-500 font-bold lowercase">compiling activity feed...</span>
        </div>
      ) : combinedActivities.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-500 font-semibold border border-dashed border-white/5 rounded-2xl">
          no activity logs on this node.
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin pr-1 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-black/5 dark:before:bg-white/5 pt-1">
          {combinedActivities.map((act) => {
            // Decide activity indicator colors and icon
            let borderGlowColor = 'border-violet-500/20 text-violet-400'
            let prefix = '•'
            
            if (act.source === 'github') {
              borderGlowColor = 'border-emerald-500/20 text-emerald-400'
              prefix = '🐙'
            } else {
              if (act.activity_type.includes('project')) {
                borderGlowColor = 'border-sky-500/20 text-sky-400'
                prefix = '🚀'
              } else if (act.activity_type.includes('focus') || act.activity_type.includes('study')) {
                borderGlowColor = 'border-purple-500/20 text-purple-400'
                prefix = '🕯️'
              } else if (act.activity_type.includes('vault')) {
                borderGlowColor = 'border-rose-500/20 text-rose-400'
                prefix = '📦'
              } else if (act.activity_type.includes('achievement')) {
                borderGlowColor = 'border-amber-500/20 text-amber-400'
                prefix = '🏆'
              }
            }

            return (
              <div key={act.id} className="flex gap-4 relative animate-fadeIn">
                <div className={`h-6.5 w-6.5 rounded-full border ${borderGlowColor} flex items-center justify-center shrink-0 z-10 bg-[#fefdfb] dark:bg-[#1a142a] text-xs font-bold shadow-sm`}>
                  {prefix}
                </div>
                <div className="space-y-0.5 mt-0.5 flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 lowercase leading-snug">
                    {act.description}
                  </p>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-bold">
                    {formatRelativeTime(act.created_at)}
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
