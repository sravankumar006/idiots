import React from 'react'
import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { CrewStats, FocusStats, StudyStats } from '../types/dashboard.types'

interface MotivationBannerProps {
  crewStats: CrewStats
  focusStats: FocusStats
  studyStats: StudyStats
}

export default function MotivationBanner({ crewStats, focusStats, studyStats }: MotivationBannerProps) {
  const hasCrewStats = crewStats && (
    crewStats.weeklyFocusHours > 0 ||
    crewStats.activeMembersToday > 0 ||
    crewStats.activeSessions > 0 ||
    crewStats.completedSessions > 0 ||
    crewStats.totalActivities > 0 ||
    crewStats.totalMemories > 0 ||
    crewStats.totalChatMessages > 0
  )

  return (
    <Card className="mb-6 p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">crew motivation status</span>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {hasCrewStats ? (
              <>
                The crew logged <span className="text-amber-500 font-bold">{crewStats.weeklyFocusHours}h focus time</span> this week. <span className="text-emerald-500 font-bold">{crewStats.activeMembersToday} member{crewStats.activeMembersToday !== 1 ? 's' : ''}</span> active today!
              </>
            ) : (
              "No activity data available yet"
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-bold text-gray-600 dark:text-gray-300">
        study streak: <span className="text-rose-400 font-black">{focusStats.streak || studyStats.current_streak} days</span> 🔥
      </div>
    </Card>
  )
}
