import React from 'react'
import { GraduationCap, Trash2, Plus, Edit3, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { RoadmapItem } from '../types/dashboard.types'

interface RoadmapMilestonesProps {
  localStages: string[]
  roadmapItems: RoadmapItem[]
  isReadOnly: boolean
  handleDeleteStage: (stage: string) => Promise<void>
  editingItemId: string | null
  editingItemTitle: string
  setEditingItemTitle: (title: string) => void
  editingItemStage: string
  setEditingItemStage: (stage: string) => void
  handleSaveEdit: (id: string) => Promise<void>
  handleCancelEdit: () => void
  handleToggleGoal: (item: RoadmapItem) => Promise<void>
  handleStartEdit: (item: RoadmapItem) => void
  handleMoveItem: (idx: number, direction: 'up' | 'down') => Promise<void>
  handleDeleteGoal: (id: string, title: string) => Promise<void>
  newGoalTitles: Record<string, string>
  setNewGoalTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>
  handleAddGoal: (stage: string) => Promise<void>
  showAddStage: boolean
  setShowAddStage: (val: boolean) => void
  newStageName: string
  setNewStageName: (val: string) => void
  handleAddStage: (e: React.FormEvent) => void
}

export default function RoadmapMilestones({
  localStages,
  roadmapItems,
  isReadOnly,
  handleDeleteStage,
  editingItemId,
  editingItemTitle,
  setEditingItemTitle,
  editingItemStage,
  setEditingItemStage,
  handleSaveEdit,
  handleCancelEdit,
  handleToggleGoal,
  handleStartEdit,
  handleMoveItem,
  handleDeleteGoal,
  newGoalTitles,
  setNewGoalTitles,
  handleAddGoal,
  showAddStage,
  setShowAddStage,
  newStageName,
  setNewStageName,
  handleAddStage
}: RoadmapMilestonesProps) {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-violet-500" />
        Learning Roadmap
      </h3>

      <div className="space-y-6 pt-2">
        {localStages.map((stage) => {
          const stageItems = roadmapItems.filter(item => item.stage === stage)
          
          return (
            <div key={stage} className="space-y-2.5">
              {/* Stage Header */}
              <div className="border-b border-black/5 dark:border-white/5 pb-1.5 flex items-center justify-between group/stage">
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 lowercase tracking-wide">
                  {stage}
                </span>
                {!isReadOnly && localStages.length > 1 && (
                  <button
                    onClick={() => handleDeleteStage(stage)}
                    className="opacity-0 group-hover/stage:opacity-100 transition-opacity p-1 rounded hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 cursor-pointer"
                    title={`Delete stage "${stage}"`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Goals under this stage */}
              <div className="space-y-1">
                {stageItems.length > 0 ? (
                  stageItems.map((item) => {
                    const globalIdx = roadmapItems.findIndex(i => i.id === item.id)
                    return (
                      <div key={item.id} className="group/item flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all">
                        {editingItemId === item.id ? (
                          <div className="flex flex-col gap-2 w-full">
                            <input
                              type="text"
                              value={editingItemTitle}
                              onChange={(e) => setEditingItemTitle(e.target.value)}
                              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg px-2.5 py-1 text-gray-800 dark:text-white font-semibold text-xs"
                              placeholder="Goal title"
                            />
                            <div className="flex items-center gap-2">
                              <select
                                value={editingItemStage}
                                onChange={(e) => setEditingItemStage(e.target.value)}
                                className="bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/5 dark:border-white/5 rounded-lg px-2 py-1 text-gray-800 dark:text-white font-semibold text-[10px]"
                              >
                                {localStages.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                  onClick={() => handleSaveEdit(item.id)}
                                  className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 cursor-pointer"
                                  title="Save"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                disabled={isReadOnly}
                                onChange={() => handleToggleGoal(item)}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-black/10 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                id={`goal-item-${item.id}`}
                              />
                              <label
                                htmlFor={`goal-item-${item.id}`}
                                className={`font-semibold cursor-pointer truncate ${
                                  item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {item.title}
                              </label>
                            </div>
                            
                            {!isReadOnly && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-all ml-2 shrink-0">
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                                  title="Edit goal"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveItem(globalIdx, 'up')}
                                  disabled={globalIdx === 0}
                                  className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                  title="Move Up"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveItem(globalIdx, 'down')}
                                  disabled={globalIdx === roadmapItems.length - 1}
                                  className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                  title="Move Down"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGoal(item.id, item.title)}
                                  className="p-0.5 rounded-lg hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 cursor-pointer"
                                  title="Delete goal"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-[10px] text-gray-500 font-medium pl-2 italic">No goals added yet.</p>
                )}
              </div>

              {/* Add goal inside this stage */}
              {!isReadOnly && (
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <input
                    type="text"
                    placeholder={`+ add goal to ${stage}...`}
                    value={newGoalTitles[stage] || ''}
                    onChange={(e) => setNewGoalTitles(prev => ({ ...prev, [stage]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddGoal(stage)
                    }}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl px-2.5 py-1 text-gray-800 dark:text-white font-semibold text-[10px] focus:outline-none focus:border-violet-500/30"
                  />
                  <button
                    onClick={() => handleAddGoal(stage)}
                    className="glass-button p-1 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                    title="Add goal"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Add New Stage section */}
        {!isReadOnly && (
          <div className="pt-2 border-t border-black/5 dark:border-white/5">
            {showAddStage ? (
              <form onSubmit={handleAddStage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Stage name (e.g. Backend Roadmap)..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl px-3 py-1.5 text-gray-800 dark:text-white font-semibold text-xs focus:outline-none focus:border-violet-500/30"
                  autoFocus
                />
                <button
                  type="submit"
                  className="glass-button px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStage(false)}
                  className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowAddStage(true)}
                className="w-full border border-dashed border-black/10 dark:border-white/10 rounded-2xl py-2 px-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Stage</span>
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
