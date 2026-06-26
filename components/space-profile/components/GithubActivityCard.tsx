import React from 'react'
import { RefreshCw, Lock, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProfileIntegration } from '../types/space-profile.types'

import Github from '@/components/ui/GithubIcon'

interface GithubActivityCardProps {
  integration: ProfileIntegration | null
  loadingGithub: boolean
  githubError: string | null
  githubData: any
}

export default function GithubActivityCard({
  integration,
  loadingGithub,
  githubError,
  githubData
}: GithubActivityCardProps) {
  if (!integration?.github_username) return null

  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Github className="h-4 w-4 text-violet-400" />
        Developer Activity
      </h3>

      {loadingGithub && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
          <RefreshCw className="h-5 w-5 text-violet-500 animate-spin" />
          <span className="text-[10px] text-gray-500 font-bold lowercase">fetching activity logs...</span>
        </div>
      )}

      {githubError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2.5">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            {githubError === 'GitHub user not found' ? 'invalid github username' : 'github api currently unavailable'}
          </span>
        </div>
      )}

      {!loadingGithub && !githubError && githubData && (
        <div className="space-y-6">
          {/* User info overview banner */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 dark:bg-black/20 p-4 rounded-2xl border border-white/5">
            <img 
              src={githubData.profile.avatar_url} 
              alt="github avatar" 
              className="h-16 w-16 rounded-2xl border border-white/10 shadow-md"
            />
            <div className="text-center sm:text-left flex-1 space-y-1">
              <h4 className="text-sm font-black text-gray-900 dark:text-white lowercase">
                {githubData.profile.name}
              </h4>
              {githubData.profile.bio && (
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 italic">
                  "{githubData.profile.bio}"
                </p>
              )}
              <div className="flex justify-center sm:justify-start gap-4 text-[10px] text-gray-400 uppercase font-extrabold mt-1">
                <span>{githubData.profile.followers} followers</span>
                <span>•</span>
                <span>{githubData.profile.following} following</span>
              </div>
            </div>
          </div>

          {/* Quick activity stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="neo-inset-panel border-none p-3.5 rounded-2xl text-center">
              <span className="text-[9px] text-neo-secondary uppercase block font-bold">Public Repos</span>
              <span className="text-lg font-black text-[#5E4545] dark:text-[#ffb4b4]">{githubData.profile.public_repos}</span>
            </div>
            <div className="neo-inset-panel border-none p-3.5 rounded-2xl text-center">
              <span className="text-[9px] text-neo-secondary uppercase block font-bold">Total Stars</span>
              <span className="text-lg font-black text-amber-400">{githubData.activity.total_stars} ⭐</span>
            </div>
            <div className="neo-inset-panel border-none p-3.5 rounded-2xl text-center col-span-2">
              <span className="text-[9px] text-neo-secondary uppercase block font-bold">Top Languages</span>
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {githubData.activity.top_languages.length > 0 ? (
                  githubData.activity.top_languages.map((lang: string, i: number) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/10 font-bold">
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-gray-500 font-semibold italic">none</span>
                )}
              </div>
            </div>
          </div>

          {/* Latest Updated Repo */}
          {githubData.activity.recent_repos.length > 0 ? (
            <div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold mb-2">latest updated repository</span>
              <div className="neo-inset-panel border-none p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <a 
                    href={githubData.activity.recent_repos[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-violet-400 hover:underline flex items-center gap-1 lowercase"
                  >
                    <span>{githubData.activity.recent_repos[0].name}</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <span className="text-[9px] font-extrabold text-amber-400 flex items-center gap-0.5">
                    ⭐ {githubData.activity.recent_repos[0].stars}
                  </span>
                </div>
                {githubData.activity.recent_repos[0].description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
                    {githubData.activity.recent_repos[0].description}
                  </p>
                )}
                <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-extrabold pt-1">
                  <span>Language: {githubData.activity.recent_repos[0].language || 'Unknown'}</span>
                  <span>pushed {new Date(githubData.activity.recent_repos[0].pushed_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
              no repositories found.
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
