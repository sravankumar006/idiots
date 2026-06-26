import React from 'react'
import { Trophy, Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Achievement, ActivityLog } from '../types/dashboard.types'

interface TimelineActivityProps {
  communityAchievements: Achievement[]
  activities: ActivityLog[]
  isReadOnly: boolean
  achievementVisibility: string
  onUpdateVisibility: (val: string) => void
}

export default function TimelineActivity({
  communityAchievements,
  activities,
  isReadOnly,
  achievementVisibility,
  onUpdateVisibility
}: TimelineActivityProps) {
  return (
    <div className="space-y-6 lg:col-span-1">
      {/* Community Achievements Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Community Achievements
          </h3>
          
          {!isReadOnly && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">visibility:</span>
              <select
                value={achievementVisibility}
                onChange={(e) => onUpdateVisibility(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg px-2 py-0.5 text-gray-800 dark:text-white font-semibold text-[10px] focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="public" className="bg-[#fefdfb] dark:bg-[#1c1f26]">Public</option>
                <option value="workspace" className="bg-[#fefdfb] dark:bg-[#1c1f26]">Workspace</option>
                <option value="friends" className="bg-[#fefdfb] dark:bg-[#1c1f26]">Friends</option>
                <option value="private" className="bg-[#fefdfb] dark:bg-[#1c1f26]">Private</option>
              </select>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-1 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {communityAchievements.length > 0 ? (
            communityAchievements.slice(0, 8).map((ach) => {
              const avatarSymbol = ach.profiles?.username?.slice(0, 2).toUpperCase() || 'EX'
              
              return (
                <div key={ach.id} className="flex items-start gap-2.5 text-xs py-1.5 border-b border-black/[0.03] dark:border-white/[0.03] last:border-b-0">
                  <div className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[9px] font-black shrink-0">
                    {avatarSymbol}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      <span className="font-bold text-gray-900 dark:text-white lowercase">@{ach.profiles?.username || 'Explorer'}</span>{' '}
                      <span className="text-gray-500">{ach.verb}</span>{' '}
                      <span className="font-bold text-amber-500">{ach.title}</span>
                    </p>
                    <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                      {new Date(ach.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01]">
              No recent milestones shared.
            </div>
          )}
        </div>
      </Card>

      {/* Activity Timeline */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-400" />
          Workspace Timeline
        </h3>

        <div className="relative pl-4 border-l border-black/5 dark:border-white/5 space-y-5 pt-2">
          {activities.slice(0, 5).map((act) => {
            let dotColor = 'bg-violet-400'
            if (act.activity_type === 'study_session') dotColor = 'bg-amber-400'
            if (act.activity_type === 'coding_solve') dotColor = 'bg-emerald-400'
            if (act.activity_type === 'career_update') dotColor = 'bg-cyan-400'

            return (
              <div key={act.id} className="relative space-y-1 text-xs">
                {/* Circle marker */}
                <span className={`absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#1a1d24] ${dotColor}`} />
                
                <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-semibold">
                  {new Date(act.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <p className="font-semibold text-gray-700 dark:text-gray-300 leading-relaxed pr-1">{act.description}</p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
