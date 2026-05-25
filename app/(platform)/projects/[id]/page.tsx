'use client'

import React, { useState, useEffect, use } from 'react'
import {
  FolderHeart, GitCommit, Users, ArrowLeft, Save,
  CheckCircle, Link as LinkIcon, GitBranch, Clock, Plus, Trash
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { useProjectsData } from '@/hooks/useProjectsData'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ParamsProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailPage({ params }: ParamsProps) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const router = useRouter()
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null)
  
  useEffect(() => {
    const getSession = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setActiveUser({
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || 'Active Node',
          avatar: user.user_metadata?.avatar || 'avatar-cyber-ghost',
          created_at: user.created_at
        })
      }
    }
    getSession()
  }, [])

  const {
    loading,
    getProjectDetail,
    updateProject
  } = useProjectsData(activeUser)

  const project = getProjectDetail(id)

  // Edit states
  const [notes, setNotes] = useState('')
  const [references, setReferences] = useState('')
  const [progress, setProgress] = useState(0)
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [contributors, setContributors] = useState<string[]>(['Sravan', 'Bhanu'])

  // Load project values when fetched
  useEffect(() => {
    if (project) {
      setNotes(project.notes || '')
      setReferences(project.references_text || '')
      setProgress(project.progress || 0)
      setGithubUrl(project.github_url || '')
      setLiveUrl(project.live_url || '')
    }
  }, [project])

  // Save changes
  const handleSaveNotes = async () => {
    if (!project) return
    setIsSaving(true)

    await updateProject(project.id, {
      notes,
      references_text: references,
      progress,
      github_url: githubUrl,
      live_url: liveUrl
    })

    setTimeout(() => {
      setIsSaving(false)
    }, 800)
  }

  // Auto-save simulation on slider release
  const handleProgressChange = async (newVal: number) => {
    setProgress(newVal)
    if (!project) return
    await updateProject(project.id, { progress: newVal })
  }

  // Simulate contributor join
  const handleAddContributor = () => {
    const names = ['Sree', 'Bhuvan', 'Explorer', 'CyberCoder']
    const nextName = names[Math.floor(Math.random() * names.length)]
    if (!contributors.includes(nextName)) {
      setContributors(prev => [...prev, nextName])
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">establishing node workspace...</p>
        </div>
      </PageContainer>
    )
  }

  if (!project) {
    return (
      <PageContainer>
        <div className="text-center py-12 max-w-md mx-auto">
          <FolderHeart className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2">workspace not found</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            The workspace room you are trying to reach does not exist or has been deleted from this node.
          </p>
          <Link href="/projects" className="glass-button text-xs py-2 px-4 rounded-xl font-bold">
            Back to Creative Rooms
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      
      {/* Back button header */}
      <div className="mb-4">
        <Link href="/projects" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all font-semibold">
          <ArrowLeft className="h-4 w-4" />
          <span>back to rooms</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
        <SectionHeader 
          title={project.name} 
          description={project.description || 'Collaborative development space and resource log.'}
        />
        <button
          onClick={handleSaveNotes}
          disabled={isSaving}
          className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 mt-2 lg:mt-0"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save Workspace'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================================
            LEFT COLUMN: NOTES & REFERENCES (Markdown Editor style)
            ======================================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Notes Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                Workspace Notes
              </span>
              <span className="text-[10px] text-gray-400 font-semibold lowercase">
                markdown supported
              </span>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="# Project Notes&#10;- task list&#10;- progress update"
              rows={15}
              className="w-full text-xs bg-black/5 dark:bg-[#121216]/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-violet-500/50 font-mono resize-none leading-relaxed"
            />
          </Card>

          {/* References Card */}
          <Card className="p-6 space-y-4">
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
              Reference Links & Notes
            </span>
            <textarea
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              placeholder="links, research URLs, and reading references for the project..."
              rows={4}
              className="w-full text-xs bg-black/5 dark:bg-[#121216]/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-violet-500/50 font-medium resize-none leading-relaxed"
            />
          </Card>

        </div>

        {/* ========================================================
            RIGHT COLUMN: DETAILS, SLIDER, STACK, CONTRIBUTORS
            ======================================================== */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Progress & Deadlines */}
          <Card className="p-6 space-y-5">
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
              Project Status
            </span>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-400">workspace progress:</span>
                <span className="text-violet-500">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                className="w-full accent-violet-600 h-1.5 bg-black/5 dark:bg-white/5 rounded-lg appearance-none cursor-pointer"
                aria-label="Progress slider"
              />
            </div>

            {/* GitHub Repo */}
            <div className="space-y-2 border-t border-black/5 dark:border-white/5 pt-4">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">GitHub Repository</span>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            {/* Live website link */}
            <div className="space-y-2 border-t border-black/5 dark:border-white/5 pt-4">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Live Link</span>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. https://idiots.space"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            {/* Deadline information */}
            {project.deadline && (
              <div className="border-t border-black/5 dark:border-white/5 pt-4 flex items-center gap-2 text-xs">
                <Clock className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                <span className="text-gray-400">target date:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </Card>

          {/* Tech Stack Used */}
          <Card className="p-6 space-y-4">
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
              Tech Stack Used
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {project.tech_stack.map((tech) => (
                <span key={tech} className="text-[10px] font-bold bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-xl lowercase">
                  {tech}
                </span>
              ))}
            </div>
          </Card>

          {/* Project Contributors */}
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                Workspace Contributors
              </span>
              <button
                onClick={handleAddContributor}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-all cursor-pointer"
                title="Add contributor mock"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 pt-1 font-semibold text-xs text-gray-700 dark:text-gray-300">
              {contributors.map((contrib, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-2 rounded-xl">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center text-[9px] font-bold text-black shadow-sm shrink-0">
                    {contrib.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{contrib}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

    </PageContainer>
  )
}
