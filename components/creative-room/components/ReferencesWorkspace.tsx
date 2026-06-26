import React from 'react'
import { Card } from '@/components/ui/Card'

interface ReferencesWorkspaceProps {
  references: string
  setReferences: (val: string) => void
  broadcastAction: (action: string | null) => void
}

export default function ReferencesWorkspace({
  references,
  setReferences,
  broadcastAction
}: ReferencesWorkspaceProps) {
  return (
    <Card className="p-6 space-y-4 max-w-4xl mx-auto">
      <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
        Reference Links & Notes
      </span>
      <textarea
        value={references}
        onChange={(e) => {
          setReferences(e.target.value)
          broadcastAction('updating links')
        }}
        onBlur={() => broadcastAction(null)}
        placeholder="links, research URLs, and reading references for the project..."
        rows={12}
        className="w-full text-xs bg-black/5 dark:bg-[#121216]/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-violet-500/50 font-medium resize-none leading-relaxed"
      />
    </Card>
  )
}
