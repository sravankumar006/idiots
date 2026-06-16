'use client'

import React, { useState, useEffect } from 'react'
import {
  Clock,
  FolderHeart,
  ArrowRight,
  Flame,
  Zap,
  Award,
  Sparkles,
  ChevronRight,
  Code,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useProjectsData } from '@/hooks/useProjectsData'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export default function GrowthPage() {
  const supabase = createClient()
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (prof) {
          setActiveProfile(prof as UserProfile)
        }
      }
    }
    getSession()
  }, [supabase])

  const {
    loading: dashLoading,
    focusStats,
    studyStats,
    focusSessions = []
  } = useDashboardData(activeProfile)

  const {
    projects,
    loading: projectsLoading
  } = useProjectsData(activeProfile)

  const isLoading = dashLoading || projectsLoading || !activeProfile

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">establishing secure growth node...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SectionHeader
        title="growth space"
        description="synchronize your study workflow and manage workspace nodes"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* ========================================================
            1. ZEN FOCUS DECK
            ======================================================== */}
        <Card glowColor="purple" className="flex flex-col justify-between space-y-6 relative overflow-hidden group min-h-[420px]">
          {/* Accent ambient glow */}
          <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center text-[#7c3aed]">
                  <Clock className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase">
                    zen focus
                  </h3>
                  <span className="text-[10px] text-neo-muted font-bold uppercase tracking-wider block mt-0.5">
                    deep work environment
                  </span>
                </div>
              </div>
              
              {/* Daily Streak node */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-500">
                <Flame className="h-3.5 w-3.5 fill-rose-500 animate-bounce" />
                <span>{studyStats?.current_streak || 0} days streak</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Enter a high-bandwidth focus deck to write code, study topics, or read research materials. Includes ambient noise environments, customizable durations, and strict blockades to restrict crew notifications during deep flow state cycles.
            </p>

            {/* Focus Metrics Panel */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="bg-neo-bg shadow-neo-inset-shallow p-3 rounded-2xl text-center">
                <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-wider block mb-1">Total Hours</span>
                <span className="text-sm font-bold text-gray-800 dark:text-white">
                  {focusStats?.totalHours || 0}h
                </span>
              </div>
              <div className="bg-neo-bg shadow-neo-inset-shallow p-3 rounded-2xl text-center">
                <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-wider block mb-1">Sessions Done</span>
                <span className="text-sm font-bold text-gray-800 dark:text-white">
                  {focusStats?.totalSessions || 0}
                </span>
              </div>
              <div className="bg-neo-bg shadow-neo-inset-shallow p-3 rounded-2xl text-center">
                <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-wider block mb-1">Completed Mins</span>
                <span className="text-sm font-bold text-gray-800 dark:text-white">
                  {Math.round((focusStats?.weeklyMinutes || 0) + (focusStats?.monthlyMinutes || 0))}m
                </span>
              </div>
            </div>

            {/* Focus History Preview */}
            {focusSessions.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-wider block">Recent Accomplishments</span>
                <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1 scrollbar-thin">
                  {focusSessions.filter(s => s.accomplishments).slice(0, 2).map((s) => (
                    <div key={s.id} className="bg-neo-bg shadow-neo-shallow px-3 py-2 rounded-xl text-[10px] flex justify-between items-center font-semibold text-gray-600 dark:text-gray-400">
                      <span className="truncate flex-1 pr-4 lowercase">{s.goal}: {s.accomplishments}</span>
                      <span className="text-violet-500 font-bold shrink-0">{s.actual_minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            <Link href="/growth/focus" className="block w-full">
              <button className="w-full py-3.5 bg-white/20 dark:bg-white/[0.03] backdrop-blur-md border border-white/40 dark:border-white/10 text-violet-600 dark:text-violet-400 rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:bg-white/30 dark:hover:bg-white/[0.06] hover:border-white/60 dark:hover:border-white/20 active:translate-y-0.5 flex items-center justify-center gap-1.5 shadow-sm">
                <span>Start Focus Session</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </Card>

        {/* ========================================================
            2. CREATIVE ROOMS
            ======================================================== */}
        <Card glowColor="cyan" className="flex flex-col justify-between space-y-6 relative overflow-hidden group min-h-[420px]">
          {/* Accent ambient glow */}
          <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                  <FolderHeart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase">
                    creative rooms
                  </h3>
                  <span className="text-[10px] text-neo-muted font-bold uppercase tracking-wider block mt-0.5">
                    collaborative workspaces
                  </span>
                </div>
              </div>

              {/* Counter tag */}
              <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-500">
                <span>{projects.length} Rooms active</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Launch shared development boards where your crew can coordinate codebase targets, write markdown documentation, review roadmap checklists, and link live project repositories directly to GitHub integrations.
            </p>

            {/* Projects list preview */}
            <div className="pt-2 space-y-2">
              <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-wider block">Active Rooms</span>
              {projects.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01]">
                  <span className="text-[10px] text-gray-400 font-bold lowercase">No active workspaces established</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[145px] overflow-y-auto pr-1 scrollbar-thin">
                  {projects.slice(0, 2).map((project) => (
                    <Link key={project.id} href={`/growth/creative/${project.id}`} className="block">
                      <div className="bg-neo-bg shadow-neo-shallow hover:shadow-neo px-3 py-2.5 rounded-xl border border-transparent hover:border-cyan-500/15 transition-all text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-[11px] text-gray-900 dark:text-white lowercase group-hover:text-cyan-500 transition-colors">
                            {project.name}
                          </span>
                          <span className="text-[9px] text-cyan-500 font-black">{project.progress}% completed</span>
                        </div>
                        {/* Progress track */}
                        <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <Link href="/growth/creative" className="block w-full">
              <button className="w-full py-3.5 bg-white/20 dark:bg-white/[0.03] backdrop-blur-md border border-white/40 dark:border-white/10 text-cyan-600 dark:text-cyan-400 rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:bg-white/30 dark:hover:bg-white/[0.06] hover:border-white/60 dark:hover:border-white/20 active:translate-y-0.5 flex items-center justify-center gap-1.5 shadow-sm">
                <span>Enter Creative Rooms</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
