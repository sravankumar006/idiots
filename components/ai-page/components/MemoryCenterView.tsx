import React from 'react'
import { Database, Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface MemoryCenterViewProps {
  memories: any[]
  summaries: any[]
  loadingMemory: boolean
  glowingMemoryId: string | null
}

export default function MemoryCenterView({
  memories,
  summaries,
  loadingMemory,
  glowingMemoryId
}: MemoryCenterViewProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-400" />
            Contextual Memories
          </h3>
          
          {loadingMemory ? (
            <div className="h-40 flex items-center justify-center text-xs text-gray-500 font-semibold animate-pulse">Indexing memories...</div>
          ) : memories.length === 0 ? (
            <Card className="p-10 text-center text-xs text-gray-500 font-semibold border border-white/5 bg-transparent">
              Rocky hasn't learned anything specific about you yet. Talk to Rocky more to generate memories!
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memories.map((mem) => (
                <Card 
                  key={mem.id} 
                  id={`memory-${mem.id}`}
                  className={`p-5 space-y-3 transition-all duration-1000 border border-white/5 hover:border-violet-500/20 ${
                    glowingMemoryId === mem.id 
                      ? 'ring-2 ring-violet-500 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)] bg-violet-500/10'
                      : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {mem.memory_type}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold">
                      {new Date(mem.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-200">{mem.title}</h4>
                    <p className="text-xs text-neo-secondary mt-1 leading-relaxed">{mem.content}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            Conversation Summaries
          </h3>
          
          {loadingMemory ? (
            <div className="h-40 flex items-center justify-center text-xs text-gray-500 font-semibold animate-pulse">Loading summaries...</div>
          ) : summaries.length === 0 ? (
            <Card className="p-10 text-center text-xs text-gray-500 font-semibold border border-white/5 bg-transparent">
              No lengthy conversations have been summarized yet.
            </Card>
          ) : (
            <div className="space-y-4">
              {summaries.map((sum) => (
                <Card key={sum.id} className="p-5 space-y-2 border border-white/5 bg-transparent">
                  <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Context Sync</span>
                    <span className="text-[10px] text-gray-500">{new Date(sum.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-900 dark:text-gray-300 leading-relaxed font-medium">
                    {sum.summary}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
