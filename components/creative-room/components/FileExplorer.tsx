import React from 'react'
import { Plus, ChevronLeft, ChevronRight, FileCode, Edit3, Trash } from 'lucide-react'
import { getFileIconColor } from '../utils/creative-room.utils'

interface FileExplorerProps {
  filesLoading: boolean
  files: any[]
  activeFileId: string | null
  setActiveFileId: (id: string | null) => void
  broadcastAction: (action: string | null) => void
  renamingFileId: string | null
  renamingFileName: string
  setRenamingFileName: (val: string) => void
  handleSaveRename: (fileId: string) => void
  renamingFileError: string | null
  handleStartRename: (fileId: string, currentName: string) => void
  handleDeleteFile: (fileId: string, filename: string) => void
  setIsNewFileModalOpen: (val: boolean) => void
  isExplorerOpen: boolean
  setIsExplorerOpen: (val: boolean) => void
}

export default function FileExplorer({
  filesLoading,
  files,
  activeFileId,
  setActiveFileId,
  broadcastAction,
  renamingFileId,
  renamingFileName,
  setRenamingFileName,
  handleSaveRename,
  renamingFileError,
  handleStartRename,
  handleDeleteFile,
  setIsNewFileModalOpen,
  isExplorerOpen,
  setIsExplorerOpen
}: FileExplorerProps) {
  return (
    <div className={`lg:col-span-1 border-r border-black/5 dark:border-white/5 flex flex-col h-[650px] transition-all duration-300 ${isExplorerOpen ? 'block' : 'hidden lg:block lg:w-12 overflow-hidden'}`}>
      <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.01]">
        {isExplorerOpen && (
          <>
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Explorer</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsNewFileModalOpen(true)}
                className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
                title="Create code file"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={() => setIsExplorerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 lg:hidden cursor-pointer"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
            </div>
          </>
        )}
        {!isExplorerOpen && (
          <button 
            onClick={() => setIsExplorerOpen(true)}
            className="mx-auto p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 cursor-pointer"
            title="Expand explorer"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {isExplorerOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {filesLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="h-4 w-4 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
              <span className="text-[10px] text-gray-500">Loading code tree...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[10px] text-gray-400 font-semibold mb-2">No files initialized</p>
              <button
                onClick={() => setIsNewFileModalOpen(true)}
                className="glass-button text-[10px] py-1.5 px-3 rounded-lg font-bold"
              >
                Add File
              </button>
            </div>
          ) : (
            files.map((file) => {
              const isFileActive = file.id === activeFileId
              const isFileRenaming = file.id === renamingFileId
              return (
                <div
                  key={file.id}
                  className={`group flex items-center justify-between p-2 rounded-xl transition-all font-mono text-[11px] font-semibold border ${
                    isFileActive
                      ? 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (!isFileRenaming) {
                        setActiveFileId(file.id)
                        broadcastAction(`editing ${file.name}`)
                      }
                    }}
                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                  >
                    <FileCode className={`h-4 w-4 shrink-0 ${getFileIconColor(file.name)}`} />
                    {isFileRenaming ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={renamingFileName}
                          onChange={(e) => setRenamingFileName(e.target.value)}
                          onBlur={() => handleSaveRename(file.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(file.id)}
                          autoFocus
                          className="w-full bg-white dark:bg-black border border-violet-500 rounded px-1 text-[11px] text-gray-800 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {renamingFileError && (
                          <span className="text-[9px] text-rose-500 font-sans block">{renamingFileError}</span>
                        )}
                      </div>
                    ) : (
                      <span className="truncate">{file.name}</span>
                    )}
                  </div>

                  {!isFileRenaming && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 ml-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartRename(file.id, file.name)
                        }}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                        title="Rename file"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(file.id, file.name)
                        }}
                        className="p-1 rounded hover:bg-rose-500/10 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        title="Delete file"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
