import React from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'

interface TickerHeaderProps {
  activeTab: string
  activeFile: any
  actionAlerts: Record<string, string>
  codeSaveStatus: 'saved' | 'saving' | 'unsaved' | null
  codeLastSaved: Date | null
}

export default function TickerHeader({
  activeTab,
  activeFile,
  actionAlerts,
  codeSaveStatus,
  codeLastSaved
}: TickerHeaderProps) {
  return (
    <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <Link href="/growth/creative" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all font-semibold">
        <ArrowLeft className="h-4 w-4" />
        <span>back to rooms</span>
      </Link>
      
      {/* Action alerts ticker (subtle live notifications) */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold">
        {Object.keys(actionAlerts).length > 0 && (
          <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-xl animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-ping" />
            <span className="text-violet-500 font-extrabold lowercase">
              {Object.entries(actionAlerts).map(([username, act]) => `${username} is ${act}`).join(', ')}
            </span>
          </div>
        )}

        {/* Code status indicator */}
        {activeTab === 'code' && activeFile && (
          <div className="flex items-center gap-2">
            {codeSaveStatus === 'saved' && (
              <span className="text-emerald-500 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {codeSaveStatus === 'saving' && (
              <span className="text-amber-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Saving...
              </span>
            )}
            {codeSaveStatus === 'unsaved' && (
              <span className="text-rose-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" /> Unsaved Changes
              </span>
            )}
            {codeLastSaved && (
              <span className="text-gray-400 font-medium text-[10px]">
                ({codeLastSaved.toLocaleTimeString()})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
