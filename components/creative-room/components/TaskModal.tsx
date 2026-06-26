import React from 'react'

interface TaskModalProps {
  isNewTaskModalOpen: boolean
  setIsNewTaskModalOpen: (val: boolean) => void
  handleCreateTask: (e: React.FormEvent) => void
  taskTitle: string
  setTaskTitle: (val: string) => void
  taskDesc: string
  setTaskDesc: (val: string) => void
  taskAssignee: string
  setTaskAssignee: (val: string) => void
  contributors: any[]
}

export default function TaskModal({
  isNewTaskModalOpen,
  setIsNewTaskModalOpen,
  handleCreateTask,
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskAssignee,
  setTaskAssignee,
  contributors
}: TaskModalProps) {
  if (!isNewTaskModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewTaskModalOpen(false)} />
      <div className="relative w-full max-w-md bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-scaleIn">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
          Create Workspace Task
        </h3>

        <form onSubmit={handleCreateTask} className="space-y-4 mt-4 text-xs font-semibold">
          <div>
            <label className="text-gray-400 block mb-1">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement WebSocket logic"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
              autoFocus
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Description (optional)</label>
            <textarea
              placeholder="Provide task specs..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              rows={2}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Assignee</label>
            <select
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="">No assignment</option>
              {contributors.map(c => (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewTaskModalOpen(false)}
              className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
