import React from 'react'
import { Plus, Trash, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface WorkspaceTasksProps {
  tasks: any[]
  toggleTaskCompletion: (id: string, completed: boolean) => void
  deleteTask: (id: string) => void
  setIsNewTaskModalOpen: (val: boolean) => void
}

export default function WorkspaceTasks({
  tasks,
  toggleTaskCompletion,
  deleteTask,
  setIsNewTaskModalOpen
}: WorkspaceTasksProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
          Workspace Task Board
        </span>
        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="text-[10px] font-bold py-1 px-3 bg-violet-600 text-white rounded-xl flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </button>
      </div>
      
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-500 italic py-2">No tasks created. Click Create Task shortcut to begin.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={(e) => toggleTaskCompletion(t.id, e.target.checked)}
                  className="h-4.5 w-4.5 rounded-lg border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <div>
                  <span className={`text-xs font-semibold ${t.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {t.title}
                  </span>
                  {t.description && (
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{t.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {t.assigned_to && (
                  <span className="text-[9px] font-bold bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-lg">
                    assigned
                  </span>
                )}
                <button
                  onClick={() => deleteTask(t.id)}
                  className="p-1 rounded hover:bg-rose-500/10 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
