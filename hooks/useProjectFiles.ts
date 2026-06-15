'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProjectFile } from '@/types'

// Default files seeded for a friendly start
const DEFAULT_FILES = (projectId: string): Omit<ProjectFile, 'id' | 'created_at' | 'updated_at'>[] => [
  {
    project_id: projectId,
    name: 'README.md',
    content: `# Welcome to your Workspace! 🚀\n\nThis is a real development workspace. You can write, edit, and organize your code here.\n\n### Tech Stack\nCheck the **Overview** tab to view progress and tech tools.\n\n### Getting Started\n- Create, rename, or delete files in the File Explorer.\n- Select a file to edit its contents with syntax highlighting, search, and themes.\n- Changes are automatically saved after a short delay.\n`
  },
  {
    project_id: projectId,
    name: 'main.py',
    content: `def main():\n    print("Hello from the Creative Room workspace!")\n    \nif __name__ == "__main__":\n    main()\n`
  }
]

export type SaveStatus = 'saved' | 'saving' | 'unsaved'

export function useProjectFiles(projectId: string | undefined) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const supabase = createClient()
  
  // Keep refs for state variables to access them in the debounce timer without re-triggering effects
  const filesRef = useRef<ProjectFile[]>([])
  const unsavedChangesRef = useRef<Record<string, string>>({}) // fileId -> newContent
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync ref with state
  useEffect(() => {
    filesRef.current = files
  }, [files])

  const getLocalStorageKey = useCallback(() => `mock_files_${projectId}`, [projectId])

  // Save changes to database or fallback to localStorage
  const persistChanges = useCallback(async (changesToSave: Record<string, string>) => {
    if (!projectId) return

    setSaveStatus('saving')
    
    // Create lists of updates
    const updatedFiles = filesRef.current.map(f => {
      if (changesToSave[f.id] !== undefined) {
        return {
          ...f,
          content: changesToSave[f.id],
          updated_at: new Date().toISOString()
        }
      }
      return f
    })

    try {
      // 1. Try persisting to Supabase
      const updatePromises = Object.entries(changesToSave).map(async ([fileId, content]) => {
        // Query the file name first since RLS/Updates might need it or we want to update by ID
        const fileObj = filesRef.current.find(f => f.id === fileId)
        if (!fileObj) return

        const { error } = await supabase
          .from('project_files')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', fileId)

        if (error) throw error
      })

      await Promise.all(updatePromises)
      
      // Update state if all DB saves succeed
      setFiles(updatedFiles)
      setSaveStatus('saved')
      setLastSaved(new Date())
    } catch (err: any) {
      console.warn("DB Save failed, writing to localStorage fallback:", err.message)
      
      // LocalStorage fallback
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(updatedFiles))
      
      // Update local state
      setFiles(updatedFiles)
      setSaveStatus('saved')
      setLastSaved(new Date())
    }
  }, [projectId, supabase, getLocalStorageKey])

  // Fetch project files on load
  const fetchFiles = useCallback(async () => {
    if (!projectId) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setFiles(data as ProjectFile[])
        // Set first file as active by default
        setActiveFileId(data[0].id)
      } else {
        // Seed default files
        const defaults = DEFAULT_FILES(projectId).map(def => ({
          ...def,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })) as ProjectFile[]

        // Try to insert in Supabase
        const { error: insertError } = await supabase
          .from('project_files')
          .insert(defaults)

        if (insertError) throw insertError

        setFiles(defaults)
        setActiveFileId(defaults[0]?.id || null)
      }
    } catch (err: any) {
      console.warn("DB files fetch failed, using localStorage fallback:", err.message)
      
      // LocalStorage Fallback
      const localData = localStorage.getItem(getLocalStorageKey())
      if (localData) {
        const parsed = JSON.parse(localData) as ProjectFile[]
        setFiles(parsed)
        if (parsed.length > 0) {
          setActiveFileId(parsed[0].id)
        }
      } else {
        // Seed default files locally
        const defaults = DEFAULT_FILES(projectId).map(def => ({
          ...def,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })) as ProjectFile[]
        
        localStorage.setItem(getLocalStorageKey(), JSON.stringify(defaults))
        setFiles(defaults)
        if (defaults.length > 0) {
          setActiveFileId(defaults[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, supabase, getLocalStorageKey])

  useEffect(() => {
    fetchFiles()
    
    // Cleanup any pending saves on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [fetchFiles])

  // Trigger immediate save of any pending edits (e.g. when switching files or leaving page)
  const saveImmediately = useCallback(() => {
    if (Object.keys(unsavedChangesRef.current).length === 0) return
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    
    const changes = { ...unsavedChangesRef.current }
    unsavedChangesRef.current = {}
    persistChanges(changes)
  }, [persistChanges])

  // Update content of a file with autosave debounce
  const updateFileContent = useCallback((fileId: string, content: string) => {
    // 1. Instantly update UI optimistically in the unsavedChanges cache
    unsavedChangesRef.current[fileId] = content
    setSaveStatus('unsaved')

    // Optimistically update the content in files list so tab toggles keep it in memory
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f))

    // 2. Clear previous timer and set new debounce timer (1.5 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const changes = { ...unsavedChangesRef.current }
      unsavedChangesRef.current = {}
      persistChanges(changes)
    }, 1500)
  }, [persistChanges])

  // Create file
  const createFile = useCallback(async (name: string, content: string = '') => {
    if (!projectId) return null

    // Check if filename already exists
    if (filesRef.current.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`A file named "${name}" already exists.`)
    }

    const newFile: ProjectFile = {
      id: crypto.randomUUID(),
      project_id: projectId,
      name,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Update state
    const updatedList = [...filesRef.current, newFile].sort((a, b) => a.name.localeCompare(b.name))
    setFiles(updatedList)
    setActiveFileId(newFile.id)

    // Save to DB
    try {
      const { error } = await supabase
        .from('project_files')
        .insert(newFile)
      
      if (error) throw error
    } catch (err: any) {
      console.warn("DB Create file failed, saving locally:", err.message)
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(updatedList))
    }

    return newFile
  }, [projectId, supabase, getLocalStorageKey])

  // Rename file
  const renameFile = useCallback(async (fileId: string, newName: string) => {
    if (!projectId) return

    // Verify name constraints
    if (filesRef.current.some(f => f.id !== fileId && f.name.toLowerCase() === newName.toLowerCase())) {
      throw new Error(`A file named "${newName}" already exists.`)
    }

    const updatedList = filesRef.current.map(f => 
      f.id === fileId ? { ...f, name: newName, updated_at: new Date().toISOString() } : f
    ).sort((a, b) => a.name.localeCompare(b.name))

    setFiles(updatedList)

    try {
      const { error } = await supabase
        .from('project_files')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', fileId)

      if (error) throw error
    } catch (err: any) {
      console.warn("DB Rename file failed, saving locally:", err.message)
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(updatedList))
    }
  }, [projectId, supabase, getLocalStorageKey])

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    if (!projectId) return

    // Cancel pending changes for this file
    delete unsavedChangesRef.current[fileId]
    if (Object.keys(unsavedChangesRef.current).length === 0 && saveStatus === 'unsaved') {
      setSaveStatus('saved')
    }

    const updatedList = filesRef.current.filter(f => f.id !== fileId)
    setFiles(updatedList)

    // Adjust active file selection if we just deleted it
    if (activeFileId === fileId) {
      setActiveFileId(updatedList[0]?.id || null)
    }

    try {
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId)

      if (error) throw error
    } catch (err: any) {
      console.warn("DB Delete file failed, saving locally:", err.message)
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(updatedList))
    }
  }, [projectId, activeFileId, saveStatus, supabase, getLocalStorageKey])

  const activeFile = files.find(f => f.id === activeFileId) || null

  return {
    loading,
    files,
    activeFile,
    activeFileId,
    setActiveFileId: (id: string | null) => {
      // Switch active file: save any pending edits instantly
      saveImmediately()
      setActiveFileId(id)
    },
    createFile,
    renameFile,
    deleteFile,
    updateFileContent,
    saveImmediately,
    saveStatus,
    lastSaved
  }
}
