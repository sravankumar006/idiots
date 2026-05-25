'use client'

import React, { useState, useEffect } from 'react'
import { FolderHeart, Plus, GitCommit, Users, ArrowRight, X } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { useProjectsData } from '@/hooks/useProjectsData'
import Link from 'next/link'

export default function ProjectsPage() {
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
    projects,
    loading,
    createProject
  } = useProjectsData(activeUser)

  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectTech, setProjectTech] = useState('')
  const [projectGh, setProjectGh] = useState('')

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) return

    const techArray = projectTech.split(',').map(t => t.trim()).filter(Boolean)
    await createProject(
      projectName.trim(),
      projectDesc.trim(),
      techArray,
      projectGh.trim()
    )

    // Clear state & close
    setProjectName('')
    setProjectDesc('')
    setProjectTech('')
    setProjectGh('')
    setIsModalOpen(false)
  }

  return (
    <PageContainer>
      <SectionHeader 
        title="Creative Rooms" 
        description="Launch and sync development workspaces, files, and project repositories."
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="glass-button py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Establish New Room</span>
          </button>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-6 w-6 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">syncing workspace list...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white/40 dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 rounded-3xl p-12 text-center mt-6 max-w-xl mx-auto">
          <FolderHeart className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">no workspace rooms found</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto mb-4">
            Creative Rooms are shared collaborative project boards where your crew can track progress, write markdown notes, and sync GitHub repo links.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="glass-button text-xs py-2 px-4 rounded-xl font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Room</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <Card className="p-6 flex flex-col justify-between h-56 relative overflow-hidden group hover:border-violet-500/30 transition-all">
                {/* Ambient hover glow */}
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white group-hover:text-violet-500 transition-colors lowercase">
                      {project.name}
                    </h3>
                    <span className="text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                      {project.progress === 100 ? 'done' : 'active'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium line-clamp-3">
                    {project.description || 'No description provided. Click to open and add information.'}
                  </p>
                </div>

                {/* Bottom Metrics Bar */}
                <div className="border-t border-black/5 dark:border-white/5 pt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <GitCommit className="h-3.5 w-3.5" />
                      {project.progress}% Complete
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project.tech_stack.length} Stack Tools
                    </span>
                  </div>
                  <span className="text-[9px] text-violet-500 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1.5">
                    open workspace <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
              establish creative room
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4 mt-4 text-xs font-semibold">
              <div>
                <label className="text-gray-400 block mb-1">Room/Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. is-design-system"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Description</label>
                <textarea
                  placeholder="brief overview of your project targets..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, TypeScript, TailwindCSS"
                  value={projectTech}
                  onChange={(e) => setProjectTech(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">GitHub Repo URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={projectGh}
                  onChange={(e) => setProjectGh(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageContainer>
  )
}
