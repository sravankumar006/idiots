import React from 'react'
import { Plus, BookOpen, Link as LinkIcon, CheckCircle2, Sparkles, Clock, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { TabId } from '../types/creative-room.types'

interface QuickActionsProps {
  setActiveTab: (tab: TabId) => void
  setIsNewFileModalOpen: (val: boolean) => void
  setIsNewTaskModalOpen: (val: boolean) => void
  setIsFocusModalOpen: (val: boolean) => void
  setIsInviteModalOpen: (val: boolean) => void
}

export default function QuickActions({
  setActiveTab,
  setIsNewFileModalOpen,
  setIsNewTaskModalOpen,
  setIsFocusModalOpen,
  setIsInviteModalOpen
}: QuickActionsProps) {
  return (
    <Card className="p-6 space-y-4">
      <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
        Quick Action Hub
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => { setActiveTab('code'); setIsNewFileModalOpen(true) }}
          className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-violet-500/30 text-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-5 w-5 text-violet-500" />
          <span className="text-[10px] font-bold">New File</span>
        </button>
        <button
          onClick={() => { setActiveTab('code'); setIsNewFileModalOpen(true) }}
          className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-emerald-500/30 text-center gap-1.5 cursor-pointer"
        >
          <BookOpen className="h-5 w-5 text-emerald-500" />
          <span className="text-[10px] font-bold">New Note</span>
        </button>
        <button
          onClick={() => { setActiveTab('references'); }}
          className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-rose-500/30 text-center gap-1.5 cursor-pointer"
        >
          <LinkIcon className="h-5 w-5 text-rose-500" />
          <span className="text-[10px] font-bold">Upload Resource</span>
        </button>
        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-amber-500/30 text-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="h-5 w-5 text-amber-500" />
          <span className="text-[10px] font-bold">Create Task</span>
        </button>
        <button
          onClick={() => {
            const el = document.getElementById('ai-chat-input-field')
            if (el) el.focus()
          }}
          className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-sky-500/30 text-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="h-5 w-5 text-sky-500" />
          <span className="text-[10px] font-bold">Ask AI</span>
        </button>
        <button
          onClick={() => setIsFocusModalOpen(true)}
          className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-500/30 text-center gap-1.5 cursor-pointer"
        >
          <Clock className="h-5 w-5 text-indigo-500" />
          <span className="text-[10px] font-bold">Focus Session</span>
        </button>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-violet-500/30 text-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="h-5 w-5 text-violet-500" />
          <span className="text-[10px] font-bold">Add Contributor</span>
        </button>
      </div>
    </Card>
  )
}
