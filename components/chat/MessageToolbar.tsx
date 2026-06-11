import React, { useState } from 'react'
import { Copy, Save, Brain, Database, FileText, Check } from 'lucide-react'
import { ChatMessage } from '@/types'

interface MessageToolbarProps {
  message: ChatMessage
  onCopy: () => void
  onSaveToVault?: (message: ChatMessage) => void
  onSave?: (target: 'saved_response' | 'vault' | 'note' | 'memory', content: string) => void
}

export default function MessageToolbar({ message, onCopy, onSave }: MessageToolbarProps) {
  const [copied, setCopied] = useState(false)
  const [savedStatus, setSavedStatus] = useState<string | null>(null)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = (target: 'saved_response' | 'vault' | 'note' | 'memory') => {
    if (onSave && message.message) {
      onSave(target, message.message)
      setSavedStatus(target)
      setTimeout(() => setSavedStatus(null), 2000)
    }
  }

  const btnClass = "p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/8 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 flex items-center justify-center relative"

  return (
    <div className="flex items-center gap-1 border-l border-black/5 dark:border-white/5 pl-1.5 ml-1.5">
      <button onClick={handleCopy} className={btnClass} title="Copy Response" aria-label="Copy Response">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      
      <button onClick={() => handleSave('saved_response')} className={btnClass} title="Save Response" aria-label="Save Response">
        {savedStatus === 'saved_response' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Save className="h-3.5 w-3.5" />}
      </button>
      
      <button onClick={() => handleSave('memory')} className={btnClass} title="Add to Memories" aria-label="Add to Memories">
        {savedStatus === 'memory' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Brain className="h-3.5 w-3.5" />}
      </button>
      
      <button onClick={() => handleSave('vault')} className={btnClass} title="Add to Scrapbook Vault" aria-label="Add to Scrapbook Vault">
        {savedStatus === 'vault' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Database className="h-3.5 w-3.5" />}
      </button>
      
      <button onClick={() => handleSave('note')} className={btnClass} title="Extract to Notes" aria-label="Extract to Notes">
        {savedStatus === 'note' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <FileText className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
