import React from 'react'
import { ChevronRight, Settings, FileCode, Plus } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { getLanguageFromFilename } from '../utils/creative-room.utils'

interface CodeWorkspaceProps {
  project: any
  activeFile: any
  editorTheme: 'vs-dark' | 'light'
  setEditorTheme: (theme: 'vs-dark' | 'light') => void
  editorFontSize: number
  setEditorFontSize: (size: number) => void
  isMinimapEnabled: boolean
  setIsMinimapEnabled: (val: boolean) => void
  isExplorerOpen: boolean
  setIsExplorerOpen: (val: boolean) => void
  updateFileContent: (fileId: string, content: string) => void
  broadcastAction: (action: string | null) => void
  setIsNewFileModalOpen: (val: boolean) => void
}

export default function CodeWorkspace({
  project,
  activeFile,
  editorTheme,
  setEditorTheme,
  editorFontSize,
  setEditorFontSize,
  isMinimapEnabled,
  setIsMinimapEnabled,
  isExplorerOpen,
  setIsExplorerOpen,
  updateFileContent,
  broadcastAction,
  setIsNewFileModalOpen
}: CodeWorkspaceProps) {
  return (
    <div className="lg:col-span-3 flex flex-col h-[650px] relative">
      {!isExplorerOpen && (
        <button
          onClick={() => setIsExplorerOpen(true)}
          className="absolute top-4 left-4 z-10 p-1.5 rounded-lg bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer"
          title="Show Explorer"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
      )}

      {/* Editor Header */}
      <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.005] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className={`flex flex-col min-w-0 ${!isExplorerOpen ? 'pl-10' : ''}`}>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Active Coding Workspace</span>
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            <span className="text-xs font-bold text-gray-900 dark:text-white">{project.name}</span>
            <span className="text-gray-400">/</span>
            <span className="font-mono text-xs font-semibold text-violet-500 truncate">
              {activeFile ? activeFile.name : 'select or create a file'}
            </span>
          </div>
        </div>

        {/* Settings Toolbar */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <div className="flex items-center gap-1">
            <Settings className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={editorTheme}
              onChange={(e) => setEditorTheme(e.target.value as 'vs-dark' | 'light')}
              className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg text-[10px] font-bold py-1 px-1.5 focus:outline-none"
            >
              <option value="vs-dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </div>

          <select
            value={editorFontSize}
            onChange={(e) => setEditorFontSize(parseInt(e.target.value))}
            className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg text-[10px] font-bold py-1 px-1.5 focus:outline-none"
          >
            {[12, 13, 14, 15, 16, 18, 20].map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>

          <button
            onClick={() => setIsMinimapEnabled(!isMinimapEnabled)}
            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
              isMinimapEnabled
                ? 'bg-violet-500/10 border-violet-500/20 text-violet-500'
                : 'border-black/5 dark:border-white/5 text-gray-400 hover:bg-black/5'
            }`}
          >
            Minimap
          </button>
        </div>
      </div>

      {/* Editor Component Div */}
      <div className="flex-1 bg-black/[0.04] dark:bg-black/[0.2] overflow-hidden relative flex flex-col justify-stretch">
        {activeFile ? (
          <Editor
            height="100%"
            width="100%"
            language={getLanguageFromFilename(activeFile.name)}
            theme={editorTheme}
            value={activeFile.content}
            onChange={(val) => {
              if (val !== undefined) {
                updateFileContent(activeFile.id, val)
                broadcastAction(`editing ${activeFile.name}`)
              }
            }}
            options={{
              minimap: { enabled: isMinimapEnabled },
              fontSize: editorFontSize,
              automaticLayout: true,
              wordWrap: 'on',
              autoIndent: 'advanced',
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6
              },
              padding: { top: 12 }
            }}
            loading={
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e] gap-2">
                <div className="h-6 w-6 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                <span className="text-[10px] text-gray-400">Loading code editor context...</span>
              </div>
            }
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-gray-500">
            <FileCode className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
              No Code File Active
            </h4>
            <p className="text-[11px] max-w-xs leading-relaxed mb-4">
              Choose a node script from the explorer sidebar, or initialize a new source code node.
            </p>
            <button
              onClick={() => setIsNewFileModalOpen(true)}
              className="glass-button py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Establish Code File</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
