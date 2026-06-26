import React from 'react'
import { Card } from '@/components/ui/Card'

interface NotesWorkspaceProps {
  notes: string
  setNotes: (val: string) => void
  broadcastAction: (action: string | null) => void
}

export default function NotesWorkspace({
  notes,
  setNotes,
  broadcastAction
}: NotesWorkspaceProps) {
  return (
    <Card className="p-6 space-y-4 max-w-4xl mx-auto">
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
        onChange={(e) => {
          setNotes(e.target.value)
          broadcastAction('editing notes')
        }}
        onBlur={() => broadcastAction(null)}
        placeholder="# Project Notes&#10;- task list&#10;- progress update"
        rows={18}
        className="w-full text-xs bg-black/5 dark:bg-[#121216]/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-violet-500/50 font-mono resize-none leading-relaxed"
      />
    </Card>
  )
}
