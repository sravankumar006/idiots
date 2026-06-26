import React from 'react'
import { Award, Briefcase, Heart } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { CareerProfile } from '../types/dashboard.types'
import { UserProfile } from '@/types'

interface CareerPortfolioCardProps {
  careerProfile: CareerProfile
  targetUser: UserProfile | null
  userAvatar: { gradient: string; symbol: string }
  moodLoading: boolean
  latestMood: any
  isReadOnly: boolean
}

export default function CareerPortfolioCard({
  careerProfile,
  targetUser,
  userAvatar,
  moodLoading,
  latestMood,
  isReadOnly
}: CareerPortfolioCardProps) {
  return (
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
              @{targetUser?.username || 'Explorer'}
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Joined {new Date(targetUser?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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

      {/* Emotional Status Card */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-400" />
          Emotional Status
        </h3>
        
        <div className="pt-2">
          {moodLoading ? (
            <p className="text-xs text-gray-500 font-medium animate-pulse">syncing emotional data...</p>
          ) : !latestMood ? (
            <p className="text-xs text-gray-500 font-medium">no emotional status tracked recently.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{latestMood.mood_label?.split(' ')[0] || '😐'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                    "{latestMood.status_text || 'stable state.'}"
                  </p>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 block">
                    {new Date(latestMood.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 pt-3 border-t border-black/5 dark:border-white/5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wider">energy level</span>
                  <span className="text-gray-500">{latestMood.energy_level}/10</span>
                </div>
                <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-400 to-rose-400 h-full rounded-full" style={{ width: `${(latestMood.energy_level / 10) * 100}%` }} />
                </div>
              </div>
              
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wider">focus level</span>
                  <span className="text-gray-500">{latestMood.focus_level}/10</span>
                </div>
                <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full" style={{ width: `${(latestMood.focus_level / 10) * 100}%` }} />
                </div>
              </div>
            </div>
          )}
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
            {careerProfile.certifications && careerProfile.certifications.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {careerProfile.certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-2 neo-inset-panel p-2 rounded-xl">
                    <Award className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{cert}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-gray-500 border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01]">
                No certifications added yet.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
