import React from 'react'
import { FolderHeart, Code2, BookText, Link as LinkIcon, Activity as ActivityIcon } from 'lucide-react'
import { TabId } from '../types/creative-room.types'

interface TabSelectorProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  saveCodeImmediately: () => void
}

export default function TabSelector({
  activeTab,
  setActiveTab,
  saveCodeImmediately
}: TabSelectorProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderHeart },
    { id: 'code', label: 'Code', icon: Code2 },
    { id: 'notes', label: 'Notes', icon: BookText },
    { id: 'references', label: 'References', icon: LinkIcon },
    { id: 'activity', label: 'Activity Feed', icon: ActivityIcon }
  ] as const

  return (
    <div className="flex flex-wrap gap-1.5 mb-6 border-b border-black/5 dark:border-white/5 pb-2">
      {tabs.map((t) => {
        const Icon = t.icon
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => {
              saveCodeImmediately()
              setActiveTab(t.id)
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? 'bg-violet-600/90 text-white shadow-md'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
