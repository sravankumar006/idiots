import React from 'react'
import { UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface PresenceListProps {
  contributors: any[]
  onlineUsers: Record<string, any>
  insights: Record<string, any>
  setIsInviteModalOpen: (val: boolean) => void
}

export default function PresenceList({
  contributors,
  onlineUsers,
  insights,
  setIsInviteModalOpen
}: PresenceListProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
          Real-time Presence
        </span>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer"
          title="Invite contributor"
        >
          <UserPlus className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="space-y-3 pt-1">
        {contributors.map((contrib) => {
          const userPresence = Object.values(onlineUsers).find(u => u.userId === contrib.id)
          const isUserOnline = !!userPresence
          const isUserFocus = userPresence?.status === 'focus'
          const isUserAway = userPresence?.status === 'away'
          
          let focusMinElapsed = 0
          if (isUserFocus && userPresence?.focusSince) {
            focusMinElapsed = Math.floor((Date.now() - new Date(userPresence.focusSince).getTime()) / 60000)
          }

          const userInsights = insights[contrib.username] || { edits: 0, tasks: 0, uploads: 0 }

          return (
            <div key={contrib.id} className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center text-[10px] font-bold text-black shadow-sm">
                    {contrib.username.slice(0, 2).toUpperCase()}
                  </div>
                  
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#1a142a] shrink-0 ${
                    isUserFocus ? 'bg-purple-500 animate-ping' :
                    isUserOnline && isUserAway ? 'bg-amber-500' :
                    isUserOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                </div>

                <div className="min-w-0">
                  <span className="text-xs font-black text-gray-800 dark:text-gray-200 truncate block lowercase">
                    {contrib.username}
                  </span>
                  
                  <span className="text-[9px] font-bold text-gray-400 block lowercase mt-0.5">
                    {isUserFocus ? `🟣 deep focus • ${focusMinElapsed} min` :
                     isUserOnline && isUserAway ? '🟡 away' :
                     isUserOnline ? '🟢 online' : '🔴 offline'}
                  </span>
                </div>
              </div>

              <div className="border-t border-black/5 dark:border-white/5 pt-2 flex items-center justify-between text-[9px] font-bold text-gray-400">
                <span>{userInsights.edits} edits this week</span>
                <span>{userInsights.tasks} task updates</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
