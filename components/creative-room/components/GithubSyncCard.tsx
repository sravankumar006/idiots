import React from 'react'
import { RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Github from '@/components/ui/GithubIcon'

interface GithubSyncCardProps {
  githubUrl: string
  syncLoading: boolean
  syncError: string | null
  syncData: any
}

export default function GithubSyncCard({
  githubUrl,
  syncLoading,
  syncError,
  syncData
}: GithubSyncCardProps) {
  if (!githubUrl) return null

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Github className="h-4 w-4 text-violet-400" />
          GitHub Project Sync
        </span>
        {syncLoading && <RefreshCw className="h-3.5 w-3.5 text-violet-500 animate-spin" />}
      </div>

      {syncLoading && !syncData && (
        <div className="text-center py-4 text-[10px] text-gray-500 font-bold lowercase animate-pulse">
          establishing connection to repository...
        </div>
      )}

      {syncError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {syncError === 'Repository not found' ? 'repo not found / private' : 'github api unavailable'}
          </span>
        </div>
      )}

      {!syncLoading && !syncError && syncData && (
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-500 dark:text-gray-400">status</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
              syncData.archived 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
            }`}>
              {syncData.archived ? 'archived' : 'active'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-500 dark:text-gray-400">stars</span>
            <span className="text-amber-400 font-extrabold flex items-center gap-0.5">
              ⭐ {syncData.stargazers_count}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-500 dark:text-gray-400">open issues</span>
            <span className="text-rose-400 font-bold">
              {syncData.open_issues_count}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-500 dark:text-gray-400">last push</span>
            <span className="text-gray-800 dark:text-gray-200">
              {new Date(syncData.pushed_at).toLocaleDateString()}
            </span>
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-2">
            <a
              href={syncData.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2 bg-neo-bg shadow-neo border-none hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-[10px] font-bold text-violet-400 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Repository</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </Card>
  )
}
