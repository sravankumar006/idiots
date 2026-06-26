import React from 'react'
import { Code, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatRelativeTime } from '../utils/space-profile.utils'

interface ActiveProjectsCardProps {
  activeProjects: any[]
  loadingProjects: boolean
}

export default function ActiveProjectsCard({ activeProjects, loadingProjects }: ActiveProjectsCardProps) {
  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Code className="h-4 w-4 text-emerald-400" />
        Active Projects
      </h3>

      {loadingProjects ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 text-emerald-500 animate-spin" />
          <span className="text-[10px] text-gray-500 font-bold lowercase">fetching project nodes...</span>
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-500 font-semibold border border-dashed border-white/5 rounded-2xl">
          no active projects hosted on this node.
        </div>
      ) : (
        <div className="space-y-4">
          {activeProjects.map(proj => (
            <div key={proj.id} className="neo-inset-panel border-none p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white lowercase">
                    {proj.name}
                  </h4>
                  {proj.description && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mt-0.5">
                      {proj.description}
                    </p>
                  )}
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-bold uppercase">
                  {proj.progress}% done
                </span>
              </div>

              {/* Glassmorphic progress bar */}
              <div className="w-full bg-white/10 dark:bg-black/20 h-2 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-extrabold pt-1">
                <span>{proj.project_contributors?.length || 0} contributors</span>
                <span>updated {formatRelativeTime(proj.updated_at || proj.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
