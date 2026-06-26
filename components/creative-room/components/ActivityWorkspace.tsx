import React from 'react'
import { Activity as ActivityIcon, GitCommit } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface ActivityWorkspaceProps {
  activities: any[]
}

export default function ActivityWorkspace({ activities }: ActivityWorkspaceProps) {
  return (
    <Card className="p-6 space-y-4 max-w-2xl mx-auto">
      <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
        Real-time Workspace Activity Feed
      </span>
      
      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ActivityIcon className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
          <p className="text-xs font-semibold">No workspace actions recorded.</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-black/5 dark:before:bg-white/5 pt-2">
          {activities.map((act) => (
            <div key={act.id} className="flex gap-4 relative animate-fadeIn">
              <div className="h-6.5 w-6.5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 z-10 bg-white dark:bg-[#1c1f26]">
                <GitCommit className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <div className="space-y-1 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-violet-500 lowercase">@{act.user_name}</span>
                  <span className="text-[10px] font-bold bg-black/5 dark:bg-white/5 text-gray-400 px-2 py-0.5 rounded-md uppercase tracking-wider text-[8px]">{act.activity_type.replace('_', ' ')}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed leading-normal">
                  {act.description}
                </p>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-bold">
                  {new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
