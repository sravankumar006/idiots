'use client'

import React, { useState } from 'react'
import {
  Sparkles, Clock, MessageSquare, FolderHeart, ArrowRight,
  Activity, Brain, Plus, Award, Briefcase, GraduationCap,
  GitBranch, BarChart2, CheckCircle2, User, Edit3, X, Calendar, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { UserProfile } from '@/types'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useProjectsData } from '@/hooks/useProjectsData'

// Avatar config
const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-indigo-400 to-purple-500',  symbol: 'CM' },
  'avatar-neon-pulse':   { gradient: 'from-purple-400 to-pink-500',    symbol: 'SL' },
  'avatar-alpha-wing':   { gradient: 'from-emerald-400 to-teal-500',   symbol: 'MM' },
  'avatar-solar-flare':  { gradient: 'from-orange-300 to-rose-400',    symbol: 'WP' },
  'avatar-void-runner':  { gradient: 'from-rose-400 to-pink-500',      symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500',   symbol: 'MS' },
}

interface DashboardClientProps {
  activeUser: UserProfile | null
}

export default function DashboardClient({ activeUser }: DashboardClientProps) {
  const {
    loading: dashLoading,
    careerProfile,
    codingStats,
    studyStats,
    activities,
    updateCareerProfile,
    syncCodingPlatform,
    addActivityLog
  } = useDashboardData(activeUser)

  const {
    projects,
    loading: projectsLoading
  } = useProjectsData(activeUser)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [dreamCompany, setDreamCompany] = useState('')
  const [favoriteLanguage, setFavoriteLanguage] = useState('')
  const [bio, setBio] = useState('')
  const [techStackInput, setTechStackInput] = useState('')
  const [goalsInput, setGoalsInput] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  // Syncing state loader
  const [isSyncing, setIsSyncing] = useState(false)

  const openEditModal = () => {
    if (!careerProfile) return
    setDreamCompany(careerProfile.dream_company)
    setFavoriteLanguage(careerProfile.favorite_language)
    setBio(careerProfile.learning_roadmap.split('\n')[0] || '') // simple mock bio
    setTechStackInput(careerProfile.tech_stack.join(', '))
    setGoalsInput(careerProfile.target_goals.join(', '))
    setResumeUrl(careerProfile.resume_url || '')
    setPortfolioUrl(careerProfile.portfolio_url || '')
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditModalOpen(false)

    const techArray = techStackInput.split(',').map((t) => t.trim()).filter(Boolean)
    const goalsArray = goalsInput.split(',').map((g) => g.trim()).filter(Boolean)

    await updateCareerProfile({
      dream_company: dreamCompany,
      favorite_language: favoriteLanguage,
      tech_stack: techArray,
      target_goals: goalsArray,
      resume_url: resumeUrl || null,
      portfolio_url: portfolioUrl || null
    })

    await addActivityLog('career_update', 'Updated career details, favorite stack, and goals.')
  }

  // Handle Sync Coding Stats
  const handleSyncStats = async () => {
    setIsSyncing(true)
    // artificial delay
    setTimeout(async () => {
      await syncCodingPlatform()
      setIsSyncing(false)
    }, 1500)
  }

  // Handle Interactive Roadmap Checkbox toggle
  const handleRoadmapToggle = async (index: number, lineText: string, isChecked: boolean) => {
    if (!careerProfile) return
    const lines = careerProfile.learning_roadmap.split('\n')
    const marker = isChecked ? '[x]' : '[ ]'
    
    // Replace checkbox marker
    lines[index] = lineText.replace(/^-\s*\[[ x/]+\]/, `- ${marker}`)
    const updatedRoadmap = lines.join('\n')

    await updateCareerProfile({ learning_roadmap: updatedRoadmap })
    await addActivityLog(
      'career_update',
      `${isChecked ? 'Completed' : 'Reset'} roadmap task: "${lineText.replace(/^-\s*\[[ x/]+\]\s*/, '')}"`
    )
  }

  if (dashLoading || !careerProfile || !codingStats || !studyStats) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">establishing secure node connection...</p>
        </div>
      </PageContainer>
    )
  }

  const userAvatar = AVATAR_MAP[activeUser?.avatar || ''] || { gradient: 'from-violet-400 to-indigo-500', symbol: 'EX' }

  // Simple statistics totals
  const totalSolved = codingStats.leetcode_solved + codingStats.hackerrank_solved + codingStats.codeforces_solved
  const studyHours = (studyStats.total_study_minutes / 60).toFixed(1)

  return (
    <PageContainer>
      
      {/* Group Motivation Banner */}
      <div className="mb-6 rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent border border-amber-500/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">crew motivation status</span>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              The crew logged <span className="text-amber-500 font-bold">{studyHours}h focus time</span> this week. <span className="text-emerald-500 font-bold">3 members</span> solved DSA problems today!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-bold text-gray-600 dark:text-gray-300">
          study streak: <span className="text-rose-400 font-black">{studyStats.current_streak} days</span> 🔥
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-5">
        <SectionHeader 
          title="Growth Dashboard" 
          description="Track progress, sync repositories, and build careers collaboratively."
        />
        <button
          onClick={openEditModal}
          className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 mt-2 lg:mt-0"
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Profile Summary</span>
        </button>
      </div>

      {/* Grid: 3-column system */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* ========================================================
            COLUMN 1: PROFILE SUMMARY & CAREER ECOSYSTEM
            ======================================================== */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* User Profile Card */}
          <Card className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar circle */}
              <div className={`h-20 w-20 rounded-full bg-gradient-to-tr ${userAvatar.gradient} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                {userAvatar.symbol}
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white lowercase">
                  @{activeUser?.username || 'Explorer'}
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Joined {new Date(activeUser?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Badges Stack */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {careerProfile.tech_stack.slice(0, 3).map((tech) => (
                  <span key={tech} className="text-[9px] font-bold bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full lowercase">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Dream / Targets */}
              <div className="w-full pt-4 border-t border-black/5 dark:border-white/5 space-y-2.5 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">favorite language:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{careerProfile.favorite_language || 'not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">target company:</span>
                  <span className="font-semibold text-amber-500">{careerProfile.dream_company || 'not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">internship:</span>
                  <span className="font-semibold text-emerald-500">{careerProfile.internship_status}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Career Links & Certifications */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-violet-400" />
              Career Portfolio
            </h3>
            
            <div className="space-y-3.5 pt-2 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Resume link</span>
                {careerProfile.resume_url ? (
                  <a href={careerProfile.resume_url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline font-bold truncate block">
                    {careerProfile.resume_url}
                  </a>
                ) : (
                  <span className="text-gray-500 font-medium">No resume linked yet</span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Portfolio website</span>
                {careerProfile.portfolio_url ? (
                  <a href={careerProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline font-bold truncate block">
                    {careerProfile.portfolio_url}
                  </a>
                ) : (
                  <span className="text-gray-500 font-medium">No portfolio linked yet</span>
                )}
              </div>

              {/* Certification badges */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Certifications</span>
                <div className="flex flex-col gap-1.5">
                  {careerProfile.certifications.map((cert) => (
                    <div key={cert} className="flex items-center gap-2 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-2 rounded-xl">
                      <Award className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

        </div>

        {/* ========================================================
            COLUMN 2: STATS & ACTIVE WORKSPACES
            ======================================================== */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Coding Stats Card */}
          <Card className="p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                Coding Platforms
              </h3>
              <button
                onClick={handleSyncStats}
                disabled={isSyncing}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-all cursor-pointer"
                title="Sync Coding platforms"
              >
                <RefreshCw className={`h-4.5 w-4.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {/* Problems solved aggregate */}
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">solved problems</span>
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white">{totalSolved}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">contributions</span>
                  <span className="text-sm font-bold text-violet-500">{codingStats.github_contributions} commits</span>
                </div>
              </div>

              {/* Platform breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-black/5 dark:border-white/5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-gray-500">LeetCode</span>
                  <span className="text-gray-800 dark:text-gray-200">{codingStats.leetcode_solved} solved</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">HackerRank</span>
                  <span className="text-gray-800 dark:text-gray-200">{codingStats.hackerrank_solved} solved</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Codeforces</span>
                  <span className="text-gray-800 dark:text-gray-200">{codingStats.codeforces_solved} solved</span>
                </div>
              </div>

              {/* Language breakdown progress bars */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block">language distribution</span>
                <div className="space-y-1.5">
                  {Object.entries(codingStats.languages_json).map(([lang, pct]) => (
                    <div key={lang} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-gray-600 dark:text-gray-400">{lang}</span>
                        <span className="text-gray-500">{pct}%</span>
                      </div>
                      <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-500 to-rose-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Study Stats Card */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-rose-400" />
              Focus & Study Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">completed hours</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{studyHours}h</span>
              </div>
              <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">pomodoros done</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{studyStats.completed_pomodoros}</span>
              </div>
              <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">pdfs analyzed</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{studyStats.pdfs_reviewed}</span>
              </div>
              <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block">ai helper sessions</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{studyStats.ai_sessions_count}</span>
              </div>
            </div>

            {/* Weekly trend chart placeholder */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">7-day focus activity</span>
              <div className="flex items-end justify-between h-14 px-2 pt-2">
                {[20, 45, 15, 60, 25, 40, 50].map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 w-6">
                    <div className="w-full bg-gradient-to-t from-violet-500 to-rose-400 rounded-t-md hover:opacity-80 transition-all cursor-pointer" style={{ height: `${val}%` }} title={`${(val*1.2).toFixed(0)}m studied`} />
                    <span className="text-[8px] font-bold text-gray-400 lowercase">{['m', 't', 'w', 't', 'f', 's', 's'][idx]}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Active Projects Feed */}
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FolderHeart className="h-4 w-4 text-amber-500" />
                Active Projects
              </h3>
              <Link href="/projects" className="text-[10px] text-violet-500 font-bold hover:underline">
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
                  <Link key={proj.id} href={`/projects/${proj.id}`} className="block bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl hover:border-violet-500/30 transition-all group">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-violet-500 transition-colors lowercase">{proj.name}</span>
                      <span className="text-[9px] text-gray-400 font-semibold">{proj.progress}%</span>
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

        {/* ========================================================
            COLUMN 3: ROADMAP & TIMELINE
            ======================================================== */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Interactive Learning Roadmap */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-violet-500" />
              Learning Roadmap
            </h3>

            <div className="space-y-3 pt-2">
              {careerProfile.learning_roadmap.split('\n').filter(Boolean).map((line, idx) => {
                const match = line.match(/^-\s*\[([ x/]+)\]\s*(.*)$/)
                if (!match) return <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-2">{line}</p>
                
                const checked = match[1].toLowerCase().includes('x')
                const text = match[2]

                return (
                  <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleRoadmapToggle(idx, line, e.target.checked)}
                      className="mt-1 h-3.5 w-3.5 rounded border-black/10 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      id={`roadmap-item-${idx}`}
                    />
                    <label
                      htmlFor={`roadmap-item-${idx}`}
                      className={`font-semibold cursor-pointer ${
                        checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {text}
                    </label>
                  </div>
                )
              })}
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

      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
              edit profile summary
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Target Company</label>
                  <input
                    type="text"
                    value={dreamCompany}
                    onChange={(e) => setDreamCompany(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Favorite Lang</label>
                  <input
                    type="text"
                    value={favoriteLanguage}
                    onChange={(e) => setFavoriteLanguage(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="React, TypeScript, Next.js, Node.js"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Target Goals (comma separated)</label>
                <input
                  type="text"
                  value={goalsInput}
                  onChange={(e) => setGoalsInput(e.target.value)}
                  placeholder="Solve 300 DSA problems, Polish LinkedIn"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Resume Link</label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Portfolio Link</label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://myportfolio.space"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
                >
                  Save Summary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageContainer>
  )
}
