'use client'

import React, { useState } from 'react'
import { Brain, Search, Plus, Calendar, Tag, FileText } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'

const INITIAL_NOTES = [
  {
    id: 'n1',
    title: 'Next.js 16 Proxy Migration Notes',
    excerpt: 'Documenting the migration from middleware.ts to proxy.ts. Note that Next.js 16 deprecates the middleware convention, requiring named proxy functions.',
    date: '2026-05-24',
    tags: ['Nextjs', 'Routing', 'Proxy'],
  },
  {
    id: 'n2',
    title: 'Supabase Cookie Authentication in Server Actions',
    excerpt: 'Detailed review of setting cookies using createServerClient inside lib/supabase/server.ts using Next.js 15 asynchronous cookies API.',
    date: '2026-05-23',
    tags: ['Supabase', 'Authentication', 'Security'],
  },
  {
    id: 'n3',
    title: 'IS AI Companion Prompt Engineering Guidelines',
    excerpt: 'Guidelines for prompting the local companion node. Focus on structural deck summaries and focus indexings.',
    date: '2026-05-20',
    tags: ['AI', 'Prompts', 'Diagnostics'],
  },
]

export default function MemoriesPage() {
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Extract all unique tags
  const allTags = Array.from(
    new Set(INITIAL_NOTES.flatMap((n) => n.tags))
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true
    return matchesSearch && matchesTag
  })

  return (
    <PageContainer>
      <SectionHeader 
        title="Mind Logs" 
        description="Index and review thoughts, database structures, and notes captured across session links."
        actions={
          <button className="glass-button py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Create Log Entry</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        
        {/* Left 1 Col: Tags Filter Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Tag Index</p>
            <div className="flex flex-wrap lg:flex-col gap-1.5">
              <button
                onClick={() => setSelectedTag(null)}
                className={`py-1.5 px-3 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                  selectedTag === null
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/3'
                }`}
              >
                Show All Logs
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`py-1.5 px-3 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-violet-500/10 text-violet-300 border border-violet-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/3'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 3 Cols: Search + Logs List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search through mind logs..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-white/2 border border-white/5 rounded-xl py-3.5 pl-4 pr-12 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/40 transition-all font-semibold"
            />
            <Search className="h-4 w-4 text-gray-500 absolute right-4" />
          </div>

          {/* Notes display */}
          <div className="space-y-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <Card key={note.id} className="p-6 space-y-3 relative overflow-hidden group">
                  {/* Glowing hover accent */}
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-violet-400/0 group-hover:bg-violet-400 transition-all duration-300" />
                  
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors">
                      {note.title}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {note.date}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    {note.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {note.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="text-[9px] font-bold text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 font-semibold text-xs border border-dashed border-white/10 rounded-2xl">
                No entries match your search criteria.
              </div>
            )}
          </div>
        </div>

      </div>
    </PageContainer>
  )
}
