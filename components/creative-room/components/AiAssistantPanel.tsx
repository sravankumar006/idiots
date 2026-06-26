import React from 'react'
import { Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface AiAssistantPanelProps {
  project: any
  notes: string
  files: any[]
  tasks: any[]
  contributors: any[]
  onlineUsers: Record<string, any>
  aiPrompt: string
  setAiPrompt: (val: string) => void
  aiMessages: any[]
  isAiLoading: boolean
  activeUser: any
  handleSendAiPrompt: (e?: React.FormEvent, commandPrompt?: string) => void
  handleTriggerAiCommand: (command: string) => void
  aiChatEndRef: React.RefObject<HTMLDivElement | null>
}

export default function AiAssistantPanel({
  project,
  notes,
  files,
  tasks,
  contributors,
  onlineUsers,
  aiPrompt,
  setAiPrompt,
  aiMessages,
  isAiLoading,
  activeUser,
  handleSendAiPrompt,
  handleTriggerAiCommand,
  aiChatEndRef
}: AiAssistantPanelProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
          Rocky AI Workspace Consultant
        </span>
        
        {/* Awareness status boxes */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Project Info', value: !!project?.description },
            { label: 'Notes', value: !!notes },
            { label: 'Stack', value: !!project?.tech_stack?.length },
            { label: 'Contributors', value: contributors.length > 0 },
            { label: 'Files', value: files.length > 0 },
            { label: 'Tasks', value: tasks.length > 0 }
          ].map((item, idx) => (
            <span key={idx} className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
              item.value
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-black/5 border-transparent text-gray-400'
            }`}>
              ✓ {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="h-44 overflow-y-auto p-3 bg-black/5 dark:bg-[#121216]/50 border border-black/5 dark:border-white/5 rounded-2xl space-y-3 scrollbar-thin">
        {aiMessages.length === 0 ? (
          <p className="text-[10px] text-gray-400 font-semibold italic text-center py-8">
            Ask Rocky about project files, completed/pending tasks, or type commands like /summarize or /progress
          </p>
        ) : (
          aiMessages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2.5 max-w-lg ${msg.sender_id === activeUser?.id ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] text-white shadow-sm shrink-0 ${
                msg.sender_id === activeUser?.id ? 'bg-violet-600' : 'bg-gradient-to-tr from-violet-500 to-rose-400'
              }`}>
                {msg.sender_id === activeUser?.id ? 'U' : 'AI'}
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-gray-400 font-bold block">
                  {msg.sender_id === activeUser?.id ? 'You' : 'Rocky AI'}
                </span>
                <div className="bg-[#fcfaf7] dark:bg-[#18181c] border border-black/5 dark:border-white/5 p-3 rounded-2xl text-[11px] text-gray-700 dark:text-gray-200 leading-normal font-medium whitespace-pre-wrap">
                  {msg.message}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={aiChatEndRef} />
      </div>

      {/* Input and fast action commands */}
      <div className="space-y-2">
        {/* Command shortcuts */}
        <div className="flex flex-wrap gap-1">
          {['/summarize', '/progress', '/tasks', '/explain', '/roadmap', '/activity', '/files'].map(cmd => (
            <button
              key={cmd}
              onClick={() => handleTriggerAiCommand(cmd)}
              className="px-2 py-1 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-lg text-[9px] font-mono font-bold hover:text-violet-500 hover:border-violet-500/20 cursor-pointer"
            >
              {cmd}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendAiPrompt} className="flex gap-2">
          <input
            id="ai-chat-input-field"
            type="text"
            placeholder="Ask AI, e.g., 'What tasks are remaining?' or type /commands..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isAiLoading}
            className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
          />
          <button
            type="submit"
            disabled={isAiLoading}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </Card>
  )
}
