import React from 'react'
import { Card } from '@/components/ui/Card'

interface HealthAndStatsProps {
  health: { status: string; description: string }
  stats: {
    files: number
    notes: number
    tasks: number
    resources: number
    contributors: number
    focusHours: number
  }
}

export default function HealthAndStats({ health, stats }: HealthAndStatsProps) {
  return (
    <>
      {/* PROJECT HEALTH ASSESSMENT CARD */}
      <Card className="p-6 space-y-4">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
          Project Health Assessment
        </span>
        
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full shrink-0 ${
              health.status === 'active' ? 'bg-emerald-500 animate-pulse' :
              health.status === 'slowing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
            }`} />
            <span className="text-xs font-extrabold capitalize text-gray-800 dark:text-white">{health.status}</span>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold leading-relaxed leading-normal">
            {health.description}
          </p>
        </div>
      </Card>

      {/* WORKSPACE STATISTICS CARD */}
      <Card className="p-6 space-y-4">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
          Workspace Statistics
        </span>
        
        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">code files</span>
            <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.files}</span>
          </div>
          <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">note sections</span>
            <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.notes}</span>
          </div>
          <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">total tasks</span>
            <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.tasks}</span>
          </div>
          <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">resource links</span>
            <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.resources}</span>
          </div>
          <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">collaborators</span>
            <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.contributors}</span>
          </div>
          <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
            <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">focus logged</span>
            <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.focusHours}h</span>
          </div>
        </div>
      </Card>
    </>
  )
}
