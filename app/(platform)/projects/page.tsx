'use client'

import React, { useState } from 'react'
import { FolderHeart, Plus, GitCommit, Users, Radio, Calendar, ChevronRight } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'

const INITIAL_PROJECTS = [
  {
    id: 'p1',
    name: 'idiots-project',
    description: 'Foundation repository for Next.js 16 and Supabase project setup, auth middleware, and glassmorphic UI systems.',
    status: 'ACTIVE',
    commits: 14,
    nodes: 3,
    lastUpdate: '2 mins ago',
    tagColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  {
    id: 'p2',
    name: 'is-design-system',
    description: 'Harmonious colors, responsive grid panels, custom animations, and typography configurations for warm cyber environments.',
    status: 'STANDBY',
    commits: 28,
    nodes: 1,
    lastUpdate: '1 day ago',
    tagColor: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
  },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS)

  return (
    <PageContainer>
      <SectionHeader 
        title="Creative Rooms" 
        description="Launch and sync development workspaces, files, and project repositories."
        actions={
          <button className="glass-button py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Establish New Room</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {projects.map((project) => (
          <Card key={project.id} className="p-6 flex flex-col justify-between h-56 relative overflow-hidden group">
            
            {/* Ambient hover glow */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors">
                  {project.name}
                </h3>
                <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full ${project.tagColor}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                {project.description}
              </p>
            </div>

            {/* Bottom Metrics Bar */}
            <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[10px] text-gray-500 font-semibold">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <GitCommit className="h-3.5 w-3.5" />
                  {project.commits} Commits
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {project.nodes} Nodes
                </span>
              </div>
              <span className="text-[9px] text-gray-400 font-bold">
                Synced {project.lastUpdate}
              </span>
            </div>

          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
