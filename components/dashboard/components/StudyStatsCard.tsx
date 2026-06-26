import React from 'react'
import { BarChart2, FolderHeart, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { FocusStats, StudyStats, FocusSession } from '../types/dashboard.types'

interface StudyStatsCardProps {
  focusStats: FocusStats
  studyStats: StudyStats
  focusSessions: FocusSession[]
  studyHours: string
  weeklyTrend: { label: string; minutes: number; heightPercent: number }[]
  projectsLoading: boolean
  projects: any[]
}

export default function StudyStatsCard({
  focusStats,
  studyStats,
  focusSessions,
  studyHours,
  weeklyTrend,
  projectsLoading,
  projects
}: StudyStatsCardProps) {
  return (
    <div className="space-y-6 lg:col-span-1">
      {/* Coding Stats Card */}
      <Card className="p-6 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            Coding Platforms
          </h3>
        </div>

        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01]">
          <GitBranch className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2 stroke-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
            Connect coding profiles to track coding progress.
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            Future integrations: GitHub, LeetCode, Codeforces, HackerRank
          </p>
        </div>
      </Card>

      {/* Study Stats Card */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-rose-400" />
          Focus & Study Stats
        </h3>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="neo-inset-panel p-3 rounded-2xl">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">completed hours</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{focusStats.totalHours || studyHours}h</span>
          </div>
          <div className="neo-inset-panel p-3 rounded-2xl">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">pomodoros done</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{studyStats.completed_pomodoros}</span>
          </div>
          <div className="neo-inset-panel p-3 rounded-2xl">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">weekly focus</span>
            <span className="text-xl font-bold text-amber-500">{Math.round(focusStats.weeklyMinutes / 60)}h {focusStats.weeklyMinutes % 60}m</span>
          </div>
          <div className="neo-inset-panel p-3 rounded-2xl">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">monthly focus</span>
            <span className="text-xl font-bold text-cyan-400">{Math.round(focusStats.monthlyMinutes / 60)}h {focusStats.monthlyMinutes % 60}m</span>
          </div>
        </div>

        {/* Collaborative Focus Session stats */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-xs">
          <span className="text-gray-400 font-semibold lowercase">collaborative sessions:</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{focusStats.collaborativeSessions} session{focusStats.collaborativeSessions !== 1 ? 's' : ''}</span>
        </div>

        {/* Goal breakdown tags */}
        {focusStats.goalBreakdown && Object.keys(focusStats.goalBreakdown).length > 0 && (
          <div className="pt-2.5 border-t border-black/5 dark:border-white/5 space-y-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">focus goals breakdown</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(focusStats.goalBreakdown).map(([goal, count]) => (
                <span key={goal} className="text-[9px] font-bold neo-inset-panel text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full lowercase">
                  {goal}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weekly trend chart */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">7-day focus activity</span>
          <div className="flex items-end justify-between h-14 px-2 pt-2">
            {weeklyTrend.map((t, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 w-6">
                <div 
                  className="w-full bg-gradient-to-t from-violet-500 to-rose-400 rounded-t-md hover:opacity-80 transition-all cursor-pointer" 
                  style={{ height: `${t.heightPercent}%` }} 
                  title={`${t.minutes}m focused`} 
                />
                <span className="text-[8px] font-bold text-gray-400 lowercase">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Accomplishments Feed */}
        {focusSessions.length > 0 && (
          <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">recent accomplishments</span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
              {focusSessions.filter(s => s.accomplishments).slice(0, 3).map((s) => (
                <div key={s.id} className="neo-inset-panel p-2.5 rounded-xl text-[11px] leading-relaxed">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-gray-800 dark:text-gray-200 lowercase truncate max-w-[80%]">{s.goal}</span>
                    <span className="text-[9px] text-amber-500 font-bold shrink-0">{s.actual_minutes}m</span>
                  </div>
                  <p className="text-gray-500 font-medium">{s.accomplishments}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Active Projects Feed */}
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FolderHeart className="h-4 w-4 text-amber-500" />
            Active Projects
          </h3>
          <Link href="/growth/creative" className="text-[10px] text-violet-500 font-bold hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-3 pt-2">
          {projectsLoading ? (
            <p className="text-xs text-gray-500 font-medium text-center">loading project spaces...</p>
          ) : projects.length === 0 ? (
            <p className="text-xs text-gray-400 font-medium text-center py-2">no projects established yet.</p>
          ) : (
            projects.slice(0, 2).map((proj) => (
              <Link key={proj.id} href={`/growth/creative/${proj.id}`} className="block neo-inset-panel p-3 rounded-2xl hover:border-violet-500/30 transition-all group">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-violet-500 transition-colors lowercase truncate max-w-[80%]">{proj.name}</span>
                  <span className="text-[9px] text-gray-400 font-semibold shrink-0">{proj.progress}%</span>
                </div>
                <div className="w-full bg-black/5 dark:bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
