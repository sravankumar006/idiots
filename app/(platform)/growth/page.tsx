'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Zap, Play, Clock, FolderHeart, Sparkles, Brain, Code, Award, Flame, 
  ChevronRight, CheckCircle2, Circle, AlertCircle, ArrowRight, BookOpen
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useProjectsData } from '@/hooks/useProjectsData'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export default function GrowthPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Get active session profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (prof) setProfile(prof as UserProfile)
        }
      } catch (err) {
        console.error("Failed to load user profile in growth:", err)
      }
    }
    loadProfile()
  }, [supabase])

  // Fetch dashboard data & projects
  const { studyStats, careerProfile, loading: dashLoading } = useDashboardData(profile)
  const { projects, loading: projLoading } = useProjectsData(profile)

  const loading = dashLoading || projLoading

  // Parse learning roadmap markdown
  const roadmapItems = useMemo(() => {
    if (!careerProfile?.learning_roadmap) return []
    
    const lines = careerProfile.learning_roadmap.split('\n')
    return lines.map((line, idx) => {
      const isCompleted = line.includes('[x]')
      const isInProgress = line.includes('[/]')
      const label = line.replace(/^-\s*\[[x/ ]\]\s*/, '').trim()
      
      let status: 'completed' | 'progress' | 'todo' = 'todo'
      if (isCompleted) status = 'completed'
      else if (isInProgress) status = 'progress'

      return { id: `item-${idx}`, label, status }
    }).filter(item => item.label.length > 0)
  }, [careerProfile])

  // Calculate roadmap completion percentage
  const roadmapProgress = useMemo(() => {
    if (roadmapItems.length === 0) return 0
    const completed = roadmapItems.filter(item => item.status === 'completed').length
    const progress = roadmapItems.filter(item => item.status === 'progress').length
    // Give half weight to in-progress items
    const score = completed + (progress * 0.5)
    return Math.min(100, Math.round((score / roadmapItems.length) * 100))
  }, [roadmapItems])

  // AI Study recommendation engine by Rocky
  const rockyInsight = useMemo(() => {
    const hours = studyStats?.total_study_minutes ? Math.floor(studyStats.total_study_minutes / 60) : 0
    const streak = studyStats?.current_streak || 1

    if (hours === 0) {
      return {
        tip: "Initialize your first focus flow session! Even 15 minutes of uninterrupted compiling boosts momentum.",
        action: "Launch a 25-minute Pomodoro",
        url: "/growth/focus"
      }
    }

    if (streak >= 3) {
      return {
        tip: `You are on a ${streak}-day study streak! Rocky recommends reviewing your collaborative project milestones today to maintain synergy.`,
        action: "Check project tasks",
        url: "/growth/creative"
      }
    }

    return {
      tip: "Your cognitive bandwidth peaks after 45 minutes of focus. Try working in a 45/15 cycle with low-fi ambient sounds today.",
      action: "Start 45m focus session",
      url: "/growth/focus"
    }
  }, [studyStats])

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">syncing growth coordinates...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionHeader 
          title="growth dashboard" 
          description="Track your cognitive focus streaks, active creative room projects, and roadmap milestones."
        />

        {/* Quick Streaks */}
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/25 rounded-2xl">
          <Flame className="h-4.5 w-4.5 text-orange-400 fill-orange-500/25 animate-pulse" />
          <span className="text-xs font-bold text-orange-300">
            {studyStats?.current_streak || 1} Day Streak
          </span>
        </div>
      </div>

      {/* Grid: 3 Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Left column (Focus Console Widget) & AI Insights */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Focus Console Preview */}
          <Card className="p-6 relative bg-gradient-to-br from-violet-500/5 via-violet-500/0 to-transparent border-white/5 overflow-hidden">
            <div className="absolute top-[-100px] left-[-100px] h-[250px] w-[250px] rounded-full bg-violet-500/5 blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest block">zen focus launcher</span>
                <h3 className="text-sm font-extrabold text-white lowercase">Focus Console</h3>
              </div>
              
              <Link href="/growth/focus">
                <button className="glass-button py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase flex items-center gap-1.5 cursor-pointer">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Enter Focus Deck</span>
                </button>
              </Link>
            </div>

            {/* Focus Stats Display */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5 relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold lowercase block">focus hours</span>
                <span className="text-xl font-extrabold text-white">
                  {studyStats?.total_study_minutes ? Math.round((studyStats.total_study_minutes / 60) * 10) / 10 : 0}h
                </span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold lowercase block">sessions done</span>
                <span className="text-xl font-extrabold text-white">
                  {studyStats?.completed_pomodoros || 0}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold lowercase block">mind help calls</span>
                <span className="text-xl font-extrabold text-white">
                  {studyStats?.ai_sessions_count || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* AI companion study insights */}
          <Card className="p-6 relative border-amber-500/10 bg-amber-500/2 overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">companion insight from rocky</span>
                <h4 className="text-xs font-extrabold text-white lowercase">Recommended action</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                  "{rockyInsight.tip}"
                </p>
                <div className="pt-2">
                  <Link href={rockyInsight.url} className="text-[10px] text-amber-400 font-bold hover:underline flex items-center gap-1">
                    <span>{rockyInsight.action}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column (Learning Roadmap Progress) */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                learning roadmap
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-black">
                {roadmapProgress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${roadmapProgress}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-3 pt-2 text-xs">
              {roadmapItems.length > 0 ? (
                roadmapItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 font-semibold text-gray-400">
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : item.status === 'progress' ? (
                      <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                    )}
                    <span className={`leading-relaxed ${item.status === 'completed' ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                      {item.label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 font-bold border border-dashed border-white/10 rounded-2xl">
                  No roadmap goals set. Update it in Dashboard settings!
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Collaborative Creative Rooms Overview (Full Width Bottom Grid) */}
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderHeart className="h-4.5 w-4.5 text-rose-400" />
            <h3 className="text-sm font-extrabold text-white lowercase tracking-wide">
              active creative rooms
            </h3>
          </div>
          <Link href="/growth/creative" className="text-[10px] text-rose-400 font-bold hover:underline">
            view all rooms →
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.slice(0, 4).map((project) => (
              <Link key={project.id} href={`/growth/creative/${project.id}`}>
                <Card className="p-6 bg-white/2 border-white/5 hover:border-rose-500/25 transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-rose-500/0 group-hover:bg-rose-500 transition-all" />
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-white lowercase group-hover:text-rose-400 transition-colors truncate">
                        {project.name}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-semibold line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-black">
                      {project.progress}%
                    </span>
                  </div>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {project.tech_stack.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] text-gray-500 font-bold">
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Progress bar inside project card */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                      <div 
                        className="bg-rose-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-gray-500 border border-dashed border-white/10 rounded-3xl">
            No projects initialized yet. Create one in the Creative Rooms!
          </div>
        )}
      </div>

    </PageContainer>
  )
}
