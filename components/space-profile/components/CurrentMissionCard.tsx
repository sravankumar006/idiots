import React from 'react'
import { Compass } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProfileIntegration } from '../types/space-profile.types'

interface CurrentMissionCardProps {
  integration: ProfileIntegration | null
}

export default function CurrentMissionCard({ integration }: CurrentMissionCardProps) {
  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Compass className="h-4 w-4 text-sky-400" />
        Current Mission
      </h3>
      
      <div className="space-y-4">
        {integration?.bio && (
          <div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold mb-1">about me</span>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {integration.bio}
            </p>
          </div>
        )}
        
        <div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold mb-2">objective</span>
          <div className="neo-inset-panel border-none p-4 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {integration?.current_mission || 'No active mission configured.'}
            </p>
            {integration?.current_mission && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <span>mission progress</span>
                  <span className="text-[#5E4545] dark:text-[#ffb4b4]">{integration.current_mission_progress}%</span>
                </div>
                <div className="w-full bg-white/10 dark:bg-black/20 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-rose-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                    style={{ width: `${integration.current_mission_progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
