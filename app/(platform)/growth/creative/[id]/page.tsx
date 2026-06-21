'use client'

import React, { useState, useEffect, use, useRef, useCallback } from 'react'
import {
  FolderHeart, GitCommit, Users, ArrowLeft, Save,
  CheckCircle, Link as LinkIcon, GitBranch, Clock, Plus, Trash,
  Code2, BookText, Activity as ActivityIcon, Edit3, ChevronLeft,
  ChevronRight, Check, AlertCircle, Eye, Settings, FileCode, Play,
  Smile, Palette, Image, Target, ChevronDown, UserPlus, Pause, Square,
  Maximize2, Sparkles, BookOpen, Heart, CheckCircle2, Send
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { useProjectsData } from '@/hooks/useProjectsData'
import { useProjectFiles } from '@/hooks/useProjectFiles'
import { useWorkspacePresence, PresenceStatus } from '@/hooks/useWorkspacePresence'
import { useWorkspaceDetails } from '@/hooks/useWorkspaceDetails'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Editor from '@monaco-editor/react'

interface ParamsProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

type TabId = 'overview' | 'code' | 'notes' | 'references' | 'activity'

const AVAILABLE_MOODS = [
  { emoji: '🚀', label: 'Shipping' },
  { emoji: '🧠', label: 'Researching' },
  { emoji: '⚙️', label: 'Building' },
  { emoji: '🔥', label: 'Crunch Time' },
  { emoji: '🎨', label: 'Designing' },
  { emoji: '📚', label: 'Learning' },
  { emoji: '😴', label: 'Idle' }
]

const ACCENT_COLORS = [
  { name: 'Indigo Accent', hex: '#6366f1', bg: 'bg-[#6366f1]' },
  { name: 'Emerald Active', hex: '#10b981', bg: 'bg-[#10b981]' },
  { name: 'Rose Glow', hex: '#f43f5e', bg: 'bg-[#f43f5e]' },
  { name: 'Amber Cozy', hex: '#f59e0b', bg: 'bg-[#f59e0b]' },
  { name: 'Sky Focus', hex: '#0ea5e9', bg: 'bg-[#0ea5e9]' },
  { name: 'Violet Cyber', hex: '#8b5cf6', bg: 'bg-[#8b5cf6]' }
]

const BANNER_PRESETS = [
  { name: 'Cyberpunk Grid', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Cozy Workspace', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Sunset Gradient', url: 'https://images.unsplash.com/photo-1538637691880-e8f000787a71?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Stars & Zen', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80' }
]

export default function ProjectDetailPage({ params, searchParams }: ParamsProps) {
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  const id = resolvedParams.id
  
  const router = useRouter()
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  
  useEffect(() => {
    const getSession = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setActiveUser({
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || 'Active Node',
          avatar: user.user_metadata?.avatar || 'avatar-cyber-ghost',
          created_at: user.created_at
        })
      }
    }
    getSession()
  }, [])

  const {
    loading: projectLoading,
    getProjectDetail,
    updateProject
  } = useProjectsData(activeUser)

  const project = getProjectDetail(id)

  // Files hook
  const {
    loading: filesLoading,
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    createFile,
    renameFile,
    deleteFile,
    updateFileContent,
    saveImmediately: saveCodeImmediately,
    saveStatus: codeSaveStatus,
    lastSaved: codeLastSaved
  } = useProjectFiles(id)

  // Edit states for overview, notes, references
  const [notes, setNotes] = useState('')
  const [references, setReferences] = useState('')
  const [progress, setProgress] = useState(0)
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Customization states
  const [mood, setMood] = useState('idle')
  const [icon, setIcon] = useState('🚀')
  const [bannerUrl, setBannerUrl] = useState('')
  const [accentColor, setAccentColor] = useState('#7c3aed')

  // Real-time presence hook
  const {
    onlineUsers,
    actionAlerts,
    broadcastAction,
    updatePresenceStatus
  } = useWorkspacePresence(id, activeUser)

  // Workspace details hook
  const {
    loading: detailsLoading,
    tasks,
    activities,
    contributors,
    focusHours,
    createTask,
    toggleTaskCompletion,
    deleteTask,
    inviteContributor,
    recordFocusSession,
    logActivity,
    getStats,
    getProjectHealth,
    getContributorInsights
  } = useWorkspaceDetails(id, activeUser, files.length, notes, references, progress)

  // Modal / Inputs state
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileError, setNewFileError] = useState<string | null>(null)
  
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null)
  const [renamingFileName, setRenamingFileName] = useState('')
  const [renamingFileError, setRenamingFileError] = useState<string | null>(null)
  const [isExplorerOpen, setIsExplorerOpen] = useState(true)

  // Customizer Panels
  const [isCustomizingMood, setIsCustomizingMood] = useState(false)
  const [isCustomizingAppearance, setIsCustomizingAppearance] = useState(false)
  const [customBannerUrlInput, setCustomBannerUrlInput] = useState('')

  // Task Creator State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')

  // Contributor Inviter State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Focus mode state
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false)
  const [focusGoal, setFocusGoal] = useState('')
  const [focusDuration, setFocusDuration] = useState(25) // minutes
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(0) // seconds
  const [isFocusActive, setIsFocusActive] = useState(false)
  const [focusSince, setFocusSince] = useState<string | null>(null)
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Focus Island Dragging & Sizing States
  const [islandSize, setIsIslandSize] = useState<'compact' | 'expanded'>('expanded')
  const [islandPosition, setIslandPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionStartRef = useRef({ x: 0, y: 0 })

  // Monaco options state
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark')
  const [editorFontSize, setEditorFontSize] = useState<number>(14)
  const [isMinimapEnabled, setIsMinimapEnabled] = useState<boolean>(true)

  // AI chat state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiMessages, setAiMessages] = useState<any[]>([])
  const [isAiLoading, setIsAiLoading] = useState(false)
  const aiChatEndRef = useRef<HTMLDivElement>(null)

  // Load project values when fetched
  useEffect(() => {
    if (project) {
      setNotes(project.notes || '')
      setReferences(project.references_text || '')
      setProgress(project.progress || 0)
      setGithubUrl(project.github_url || '')
      setLiveUrl(project.live_url || '')
      setMood(project.mood || 'idle')
      setIcon(project.icon || '🚀')
      setBannerUrl(project.banner_url || '')
      setAccentColor(project.accent_color || '#7c3aed')
    }
  }, [project])

  // Focus Timer Clock ticking
  useEffect(() => {
    if (isFocusActive && focusTimeRemaining > 0) {
      focusTimerRef.current = setTimeout(() => {
        setFocusTimeRemaining(prev => prev - 1)
        // Dynamically compute and broadcast focus time elapsed in presence status
        if (focusSince) {
          const elapsedMin = Math.floor((Date.now() - new Date(focusSince).getTime()) / 60000)
          updatePresenceStatus('focus', focusSince)
        }
      }, 1000)
    } else if (isFocusActive && focusTimeRemaining === 0) {
      // Completed!
      setIsFocusActive(false)
      updatePresenceStatus('online')
      recordFocusSession(focusDuration, focusGoal || 'Workspace Tasks')
      alert(`🎉 Focus Session completed! Outstanding effort on "${focusGoal || 'Workspace Tasks'}".`)
      setIsFocusModalOpen(false)
    }

    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    }
  }, [isFocusActive, focusTimeRemaining, focusSince, focusDuration, focusGoal, updatePresenceStatus, recordFocusSession])

  // Auto-scroll AI chat
  useEffect(() => {
    if (aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiMessages])

  // --- FOCUS ISLAND DRAGGING EVENT LISTENERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    positionStartRef.current = { ...islandPosition }
    e.preventDefault()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return
    setIsDragging(true)
    const touch = e.touches[0]
    dragStartRef.current = { x: touch.clientX, y: touch.clientY }
    positionStartRef.current = { ...islandPosition }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setIslandPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy
    })
  }, [isDragging])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const dx = touch.clientX - dragStartRef.current.x
    const dy = touch.clientY - dragStartRef.current.y
    setIslandPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp])

  // --- SAVE WORKSPACE CONFIGURATION ---
  const handleSaveWorkspace = async () => {
    if (!project) return
    setIsSaving(true)

    // Save active code edits immediately
    saveCodeImmediately()

    // Trigger timeline entry
    logActivity('customization_change', 'Updated workspace theme, banners, or links.')

    await updateProject(project.id, {
      notes,
      references_text: references,
      progress,
      github_url: githubUrl,
      live_url: liveUrl,
      mood,
      icon,
      banner_url: bannerUrl,
      accent_color: accentColor
    })

    setTimeout(() => {
      setIsSaving(false)
    }, 800)
  }

  // Auto-save progress
  const handleProgressChange = async (newVal: number) => {
    setProgress(newVal)
    if (!project) return
    await updateProject(project.id, { progress: newVal })
  }

  // --- APPEARANCE AND CUSTOMIZERS ---
  const handleSelectMood = async (newMood: string, newEmoji: string) => {
    setMood(newMood)
    setIcon(newEmoji)
    setIsCustomizingMood(false)
    logActivity('customization_change', `Updated project workspace mood to ${newEmoji} ${newMood}`)
    if (project) {
      await updateProject(project.id, { mood: newMood, icon: newEmoji })
    }
  }

  const handleSelectAccent = async (hex: string) => {
    setAccentColor(hex)
    if (project) {
      await updateProject(project.id, { accent_color: hex })
    }
  }

  const handleSelectBannerPreset = async (url: string) => {
    setBannerUrl(url)
    if (project) {
      await updateProject(project.id, { banner_url: url })
    }
  }

  const handleSelectCustomBanner = async () => {
    if (!customBannerUrlInput.trim()) return
    setBannerUrl(customBannerUrlInput.trim())
    if (project) {
      await updateProject(project.id, { banner_url: customBannerUrlInput.trim() })
    }
    setCustomBannerUrlInput('')
    setIsCustomizingAppearance(false)
  }

  // --- FILE ACTIONS ---
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewFileError(null)
    const name = newFileName.trim()
    if (!name) return

    if (!name.includes('.')) {
      setNewFileError('File name must include an extension (e.g., app.js, main.py)')
      return
    }

    try {
      await createFile(name, '')
      setNewFileName('')
      setIsNewFileModalOpen(false)
      logActivity('file_create', `Created code file: ${name}`)
    } catch (err: any) {
      setNewFileError(err.message || 'Failed to create file.')
    }
  }

  const handleStartRename = (fileId: string, currentName: string) => {
    setRenamingFileId(fileId)
    setRenamingFileName(currentName)
    setRenamingFileError(null)
  }

  const handleSaveRename = async (fileId: string) => {
    setRenamingFileError(null)
    const newName = renamingFileName.trim()
    if (!newName) {
      setRenamingFileId(null)
      return
    }

    if (!newName.includes('.')) {
      setRenamingFileError('Must include extension.')
      return
    }

    try {
      await renameFile(fileId, newName)
      setRenamingFileId(null)
      logActivity('file_update', `Renamed file to: ${newName}`)
    } catch (err: any) {
      setRenamingFileError(err.message || 'Rename failed.')
    }
  }

  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      await deleteFile(fileId)
      logActivity('file_delete', `Deleted code file: ${filename}`)
    }
  }

  // --- TASK ACTIONS ---
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    const assignee = taskAssignee === 'none' || !taskAssignee ? null : taskAssignee
    await createTask(taskTitle.trim(), taskDesc.trim(), assignee)

    setTaskTitle('')
    setTaskDesc('')
    setTaskAssignee('')
    setIsNewTaskModalOpen(false)
  }

  // --- CONTRIBUTOR INVITATION ---
  const handleInviteContributor = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    const username = inviteName.trim()
    if (!username) return

    try {
      await inviteContributor(username)
      setInviteName('')
      setIsInviteModalOpen(false)
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite contributor.')
    }
  }

  // --- FOCUS SESSION TIMER CONTROLS ---
  const handleStartFocusSession = () => {
    if (focusDuration <= 0) return
    setFocusTimeRemaining(focusDuration * 60)
    setIsFocusActive(true)
    const nowStr = new Date().toISOString()
    setFocusSince(nowStr)
    updatePresenceStatus('focus', nowStr)
    logActivity('focus_start', `Started a ${focusDuration} min workspace focus session: "${focusGoal || 'Workspace Tasks'}"`)
  }

  const handlePauseFocusSession = () => {
    setIsFocusActive(false)
    updatePresenceStatus('online')
  }

  const handleStopFocusSession = () => {
    setIsFocusActive(false)
    updatePresenceStatus('online')
    setFocusTimeRemaining(0)
    setIsFocusModalOpen(false)
    logActivity('focus_complete', `Stopped focus session.`)
  }

  // --- CONTEXTUAL AI ASSISTANT PANEL ---
  const handleSendAiPrompt = async (e?: React.FormEvent, commandPrompt?: string) => {
    if (e) e.preventDefault()
    
    const text = commandPrompt || aiPrompt.trim()
    if (!text || isAiLoading || !activeUser || !project) return

    setAiPrompt('')
    setIsAiLoading(true)

    // Build workspace context information
    const stats = getStats()
    const workspaceContext = `
[WORKSPACE DYNAMIC AI CONTEXT]
Project Name: "${project.name}"
Description: "${project.description}"
Accent Color: "${accentColor}"
Current Mood: "${mood}"
Tech Stack: ${JSON.stringify(project.tech_stack)}
Online Contributors: ${Object.values(onlineUsers).map(u => `@${u.username} (${u.status})`).join(', ') || '@' + activeUser.username}
Files in Explorer: ${files.map(f => f.name).join(', ') || 'None'}
Project Notes: "${notes}"
Pending Tasks: ${JSON.stringify(tasks.filter(t => !t.completed).map(t => t.title))}
Completed Tasks: ${JSON.stringify(tasks.filter(t => t.completed).map(t => t.title))}
References & Resources: "${references}"
Total Focus Hours: ${focusHours}h
Project Health Score: "${getProjectHealth().status} (${getProjectHealth().description})"
`

    // Setup message stack
    const userMsg = {
      id: `ai-user-${Date.now()}`,
      sender_id: activeUser.id,
      message: text,
      type: 'text',
      created_at: new Date().toISOString(),
      profiles: activeUser
    }

    const aiMessageId = `ai-resp-${Date.now()}`
    const aiMsg = {
      id: aiMessageId,
      sender_id: '00000000-0000-0000-0000-000000000000',
      message: '',
      type: 'ai',
      created_at: new Date().toISOString(),
      profiles: {
        id: '00000000-0000-0000-0000-000000000000',
        username: 'Rocky Workspace AI',
        avatar: 'avatar-cyber-ghost'
      },
      sending: true
    }

    setAiMessages(prev => [...prev, userMsg, aiMsg])

    try {
      const providerPref = localStorage.getItem('selected_ai_provider') || 'auto'
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${workspaceContext}\n\nUser Question/Command: ${text}`,
          groupId: id,
          contextMessages: aiMessages.slice(-8).map(m => ({ type: m.type, message: m.message })),
          providerPreference: providerPref
        })
      })

      if (!response.ok || !response.body) {
        throw new Error('AI query failed.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let chunkText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const textChunk = decoder.decode(value, { stream: true })
        chunkText += textChunk

        setAiMessages(prev =>
          prev.map(m => m.id === aiMessageId ? { ...m, message: chunkText } : m)
        )
      }

      setAiMessages(prev =>
        prev.map(m => m.id === aiMessageId ? { ...m, sending: false } : m)
      )

      logActivity('ai', `Asked AI workspace consultant: "${text.substring(0, 30)}..."`)

    } catch (err: any) {
      console.error(err)
      setAiMessages(prev =>
        prev.map(m => m.id === aiMessageId ? { ...m, sending: false, message: 'I encountered an error connecting to Rocky companion context.' } : m)
      )
    } finally {
      setIsAiLoading(false)
    }
  }

  // Trigger slash commands instantly
  const handleTriggerAiCommand = (command: string) => {
    let promptText = ''
    switch (command) {
      case '/summarize':
        promptText = 'Generate a concise summary of this project workspace based on the project description, current files list, notes, and task progress.'
        break
      case '/progress':
        promptText = 'Analyze the current progress of the project based on the completed/incomplete tasks and notes. Give recommendations to complete it.'
        break
      case '/tasks':
        promptText = 'Summarize the project tasks, showing completed vs pending tasks and who is assigned to each.'
        break
      case '/explain':
        promptText = 'Provide a structured technical explanation of the code files in this workspace, explaining their purpose and relationships.'
        break
      case '/roadmap':
        promptText = 'Suggest a roadmap for this project, highlighting key stages, milestones, and next actions.'
        break
      case '/activity':
        promptText = 'Analyze the recent activities in this workspace and summarize what the team has been working on.'
        break
      case '/files':
        promptText = 'List and summarize the purpose of all files currently in the workspace file explorer.'
        break
      default:
        return
    }
    handleSendAiPrompt(undefined, promptText)
  }

  // --- HELPERS ---
  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js':
      case 'jsx': return 'javascript'
      case 'ts':
      case 'tsx': return 'typescript'
      case 'py': return 'python'
      case 'cpp':
      case 'cc':
      case 'h': return 'cpp'
      case 'java': return 'java'
      case 'html':
      case 'htm': return 'html'
      case 'css': return 'css'
      case 'json': return 'json'
      case 'md': return 'markdown'
      default: return 'plaintext'
    }
  }

  const getFileIconColor = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js': return 'text-yellow-500'
      case 'ts': return 'text-sky-500'
      case 'py': return 'text-emerald-500'
      case 'cpp': return 'text-indigo-500'
      case 'java': return 'text-[#5E4545] dark:text-[#ffb4b4]'
      case 'html': return 'text-rose-500'
      case 'css': return 'text-teal-500'
      case 'json': return 'text-amber-400'
      case 'md': return 'text-violet-400'
      default: return 'text-gray-400'
    }
  }

  // Compile vertical timeline history
  const getTimelineItems = () => {
    const items: { id: string; title: string; description: string; date: Date; icon: any }[] = []
    
    // 1. Project Creation
    if (project) {
      items.push({
        id: 'creation',
        title: 'Workspace Created 🚀',
        description: `Room "${project.name}" was established.`,
        date: new Date(project.created_at),
        icon: Sparkles
      })
    }

    // 2. Database milestones & tasks completed
    tasks.forEach(task => {
      if (task.completed) {
        items.push({
          id: `task-${task.id}`,
          title: 'Task Completed 🏆',
          description: `Finished: "${task.title}".`,
          date: new Date(task.updated_at),
          icon: CheckCircle2
        })
      }
    })

    // 3. Project Activities logs
    activities.forEach(act => {
      // Exclude simple file modifications to keep timeline clean
      if (act.activity_type !== 'file_update' && act.activity_type !== 'note_edit') {
        let iconSymbol = ActivityIcon
        if (act.activity_type === 'file_create') iconSymbol = FileCode
        if (act.activity_type === 'contributor_add') iconSymbol = Users
        if (act.activity_type === 'focus_complete') iconSymbol = Clock
        
        items.push({
          id: act.id,
          title: act.activity_type.replace('_', ' '),
          description: act.description,
          date: new Date(act.created_at),
          icon: iconSymbol
        })
      }
    })

    // Sort descending by date
    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  if (projectLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">establishing node workspace...</p>
        </div>
      </PageContainer>
    )
  }

  if (!project) {
    return (
      <PageContainer>
        <div className="text-center py-12 max-w-md mx-auto animate-fadeIn">
          <FolderHeart className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2">workspace not found</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-6 font-semibold">
            The workspace room you are trying to reach does not exist or has been deleted from this node.
          </p>
          <Link href="/growth/creative" className="glass-button text-xs py-2 px-4 rounded-xl font-bold">
            Back to Creative Rooms
          </Link>
        </div>
      </PageContainer>
    )
  }

  const timelineItems = getTimelineItems()
  const stats = getStats()
  const health = getProjectHealth()
  const insights = getContributorInsights()

  // Dynamic Styles matching user customization color
  const accentStyles = {
    '--accent': accentColor,
    '--accent-hover': `${accentColor}cc`,
    '--accent-light': `${accentColor}15`
  } as React.CSSProperties

  return (
    <div style={accentStyles} className="theme-accent-container">
      <PageContainer>
        
        {/* Banner backdrop banner customization */}
        <div className="relative h-44 rounded-3xl overflow-hidden mb-6 border border-black/10 dark:border-white/10 group bg-slate-950/40">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Workspace Banner" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-600/20 via-pink-600/10 to-indigo-600/20 animate-breathing" />
          )}

          {/* Quick theme actions button */}
          <button
            onClick={() => setIsCustomizingAppearance(true)}
            className="absolute top-4 right-4 py-2 px-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <Palette className="h-4 w-4 text-violet-400" />
            <span>Customize Workspace Layout</span>
          </button>

          {/* Emoji / Mood floating customization */}
          <div className="absolute bottom-4 left-6 flex items-end gap-3.5">
            <button
              onClick={() => setIsCustomizingMood(true)}
              className="h-14 w-14 rounded-2xl bg-[#fefdfb] dark:bg-[#1a142a] border border-black/10 dark:border-white/10 flex items-center justify-center text-3xl shadow-xl hover:scale-105 transition-all cursor-pointer"
              title="Set workspace mood"
            >
              {icon}
            </button>
            <div className="mb-1 bg-black/60 backdrop-blur-md border border-white/5 py-1 px-3.5 rounded-full">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold">current mood</span>
              <p className="text-xs font-black text-white capitalize mt-0.5">{mood}</p>
            </div>
          </div>
        </div>

        {/* Back button and status header banner */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Link href="/growth/creative" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all font-semibold">
            <ArrowLeft className="h-4 w-4" />
            <span>back to rooms</span>
          </Link>
          
          {/* Action alerts ticker (subtle live notifications) */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold">
            {Object.keys(actionAlerts).length > 0 && (
              <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-xl animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-ping" />
                <span className="text-violet-500 font-extrabold lowercase">
                  {Object.entries(actionAlerts).map(([username, act]) => `${username} is ${act}`).join(', ')}
                </span>
              </div>
            )}

            {/* Code status indicator */}
            {activeTab === 'code' && activeFile && (
              <div className="flex items-center gap-2">
                {codeSaveStatus === 'saved' && (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
                {codeSaveStatus === 'saving' && (
                  <span className="text-amber-500 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Saving...
                  </span>
                )}
                {codeSaveStatus === 'unsaved' && (
                  <span className="text-rose-500 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" /> Unsaved Changes
                  </span>
                )}
                {codeLastSaved && (
                  <span className="text-gray-400 font-medium text-[10px]">
                    ({codeLastSaved.toLocaleTimeString()})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Workspace detailed titles */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
          <SectionHeader 
            title={project.name} 
            description={project.description || 'Collaborative development space and resource log.'}
          />
          <button
            onClick={handleSaveWorkspace}
            disabled={isSaving}
            className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 mt-2 lg:mt-0"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Workspace'}</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1.5 mb-6 border-b border-black/5 dark:border-white/5 pb-2">
          {(
            [
              { id: 'overview', label: 'Overview', icon: FolderHeart },
              { id: 'code', label: 'Code', icon: Code2 },
              { id: 'notes', label: 'Notes', icon: BookText },
              { id: 'references', label: 'References', icon: LinkIcon },
              { id: 'activity', label: 'Activity Feed', icon: ActivityIcon }
            ] as const
          ).map((t) => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => {
                  // Switch tab: trigger code save
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

        {/* Render Workspace Tab Pages */}
        <div className="animate-pageFadeIn">
          
          {/* ==================== 1. OVERVIEW TAB ==================== */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-6">
                
                {/* A. QUICK ACTIONS PANEL */}
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

                {/* B. TASK BOARD */}
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

                {/* C. AI WORKSPACE AWARENESS CHAT PANEL */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                      Rocky AI Workspace Consultant
                    </span>
                    
                    {/* Awareness status boxes */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Project Info', value: !!project?.description },
                        { label: 'Notes', value: !!notes },
                        { label: 'Stack', value: !!project?.tech_stack?.length },
                        { label: 'Contributors', value: contributors.length > 0 },
                        { label: 'Files', value: files.length > 0 },
                        { label: 'Tasks', value: tasks.length > 0 }
                      ].map((item, idx) => (
                        <span key={idx} className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                          item.value
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-black/5 border-transparent text-gray-400'
                        }`}>
                          ✓ {item.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="h-44 overflow-y-auto p-3 bg-black/5 dark:bg-[#121216]/50 border border-black/5 dark:border-white/5 rounded-2xl space-y-3 scrollbar-thin">
                    {aiMessages.length === 0 ? (
                      <p className="text-[10px] text-gray-400 font-semibold italic text-center py-8">
                        Ask Rocky about project files, completed/pending tasks, or type commands like /summarize or /progress
                      </p>
                    ) : (
                      aiMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-2.5 max-w-lg ${msg.sender_id === activeUser?.id ? 'ml-auto flex-row-reverse' : ''}`}>
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] text-white shadow-sm shrink-0 ${
                            msg.sender_id === activeUser?.id ? 'bg-violet-600' : 'bg-gradient-to-tr from-violet-500 to-rose-400'
                          }`}>
                            {msg.sender_id === activeUser?.id ? 'U' : 'AI'}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-gray-400 font-bold block">
                              {msg.sender_id === activeUser?.id ? 'You' : 'Rocky AI'}
                            </span>
                            <div className="bg-[#fcfaf7] dark:bg-[#18181c] border border-black/5 dark:border-white/5 p-3 rounded-2xl text-[11px] text-gray-700 dark:text-gray-200 leading-normal font-medium whitespace-pre-wrap">
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={aiChatEndRef} />
                  </div>

                  {/* Input and fast action commands */}
                  <div className="space-y-2">
                    {/* Command shortcuts */}
                    <div className="flex flex-wrap gap-1">
                      {['/summarize', '/progress', '/tasks', '/explain', '/roadmap', '/activity', '/files'].map(cmd => (
                        <button
                          key={cmd}
                          onClick={() => handleTriggerAiCommand(cmd)}
                          className="px-2 py-1 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-lg text-[9px] font-mono font-bold hover:text-violet-500 hover:border-violet-500/20 cursor-pointer"
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleSendAiPrompt} className="flex gap-2">
                      <input
                        id="ai-chat-input-field"
                        type="text"
                        placeholder="Ask AI, e.g., 'What tasks are remaining?' or type /commands..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        disabled={isAiLoading}
                        className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                      />
                      <button
                        type="submit"
                        disabled={isAiLoading}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Ask</span>
                      </button>
                    </form>
                  </div>
                </Card>

                {/* D. CHRONOLOGICAL PROJECT TIMELINE */}
                <Card className="p-6 space-y-4">
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    Workspace Historical Timeline
                  </span>
                  
                  {timelineItems.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No workspace history logged.</p>
                  ) : (
                    <div className="space-y-3.5 max-h-96 overflow-y-auto scrollbar-thin relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-black/5 dark:before:bg-white/5 pt-1">
                      {timelineItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.id} className="flex gap-4 relative animate-fadeIn">
                            <div className="h-6 w-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 z-10 bg-[#fefdfb] dark:bg-[#1a142a]">
                              <Icon className="h-3.5 w-3.5 text-violet-500" />
                            </div>
                            <div className="space-y-0.5 mt-0.5 flex-1 min-w-0">
                              <h4 className="text-[11px] font-black text-gray-800 dark:text-gray-200 lowercase">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
                                {item.description}
                              </p>
                              <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-bold">
                                {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>

              </div>

              <div className="space-y-6 lg:col-span-1">
                
                {/* E. PROJECT HEALTH & STACK CARD */}
                <Card className="p-6 space-y-4">
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    Project Health Assessment
                  </span>
                  
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full shrink-0 ${
                        health.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                        health.status === 'slowing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                      }`} />
                      <span className="text-xs font-extrabold capitalize text-gray-800 dark:text-white">{health.status}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-semibold leading-relaxed leading-normal">
                      {health.description}
                    </p>
                  </div>
                </Card>

                {/* F. WORKSPACE STATISTICS CARD */}
                <Card className="p-6 space-y-4">
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    Workspace Statistics
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
                      <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">code files</span>
                      <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.files}</span>
                    </div>
                    <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
                      <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">note sections</span>
                      <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.notes}</span>
                    </div>
                    <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
                      <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">total tasks</span>
                      <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.tasks}</span>
                    </div>
                    <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
                      <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">resource links</span>
                      <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.resources}</span>
                    </div>
                    <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
                      <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">collaborators</span>
                      <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.contributors}</span>
                    </div>
                    <div className="bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-between">
                      <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">focus logged</span>
                      <span className="text-base font-black text-gray-800 dark:text-white mt-1">{stats.focusHours}h</span>
                    </div>
                  </div>
                </Card>

                {/* G. REALTIME PRESENCE & CONTRIBUTOR CARDS */}
                <Card className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                      Real-time Presence
                    </span>
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer"
                      title="Invite contributor"
                    >
                      <UserPlus className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    {contributors.map((contrib) => {
                      const userPresence = Object.values(onlineUsers).find(u => u.userId === contrib.id)
                      const isUserOnline = !!userPresence
                      const isUserFocus = userPresence?.status === 'focus'
                      const isUserAway = userPresence?.status === 'away'
                      
                      // Calculate focus elapsed minutes if active
                      let focusMinElapsed = 0
                      if (isUserFocus && userPresence?.focusSince) {
                        focusMinElapsed = Math.floor((Date.now() - new Date(userPresence.focusSince).getTime()) / 60000)
                      }

                      // Fetch insights counts
                      const userInsights = insights[contrib.username] || { edits: 0, tasks: 0, uploads: 0 }

                      return (
                        <div key={contrib.id} className="p-3 bg-[#faf8f5] dark:bg-[#121216] border border-black/5 dark:border-white/5 rounded-2xl flex flex-col gap-2.5">
                          <div className="flex items-center gap-2.5">
                            {/* Avatar with status dot */}
                            <div className="relative shrink-0">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center text-[10px] font-bold text-black shadow-sm">
                                {contrib.username.slice(0, 2).toUpperCase()}
                              </div>
                              
                              {/* Status indicators */}
                              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#1a142a] shrink-0 ${
                                isUserFocus ? 'bg-purple-500 animate-ping' :
                                isUserOnline && isUserAway ? 'bg-amber-500' :
                                isUserOnline ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} />
                            </div>

                            <div className="min-w-0">
                              <span className="text-xs font-black text-gray-800 dark:text-gray-200 truncate block lowercase">
                                {contrib.username}
                              </span>
                              
                              {/* Current presence details */}
                              <span className="text-[9px] font-bold text-gray-400 block lowercase mt-0.5">
                                {isUserFocus ? `🟣 deep focus • ${focusMinElapsed} min` :
                                 isUserOnline && isUserAway ? '🟡 away' :
                                 isUserOnline ? '🟢 online' : '🔴 offline'}
                              </span>
                            </div>
                          </div>

                          {/* Recent contributions indicators */}
                          <div className="border-t border-black/5 dark:border-white/5 pt-2 flex items-center justify-between text-[9px] font-bold text-gray-400">
                            <span>{userInsights.edits} edits this week</span>
                            <span>{userInsights.tasks} task updates</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

              </div>

            </div>
          )}

          {/* ==================== 2. CODE TAB (MONACO WORKSPACE) ==================== */}
          {activeTab === 'code' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start min-h-[650px] border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden glass-panel bg-white/40 dark:bg-black/25">
              
              {/* FILE EXPLORER SIDEBAR */}
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

              {/* MONACO CODE EDITOR CONTAINER */}
              <div className={`lg:col-span-3 flex flex-col h-[650px] relative`}>
                
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
                          // Broadcast live editing action
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
            </div>
          )}

          {/* ==================== 3. NOTES TAB ==================== */}
          {activeTab === 'notes' && (
            <Card className="p-6 space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                  Workspace Notes
                </span>
                <span className="text-[10px] text-gray-400 font-semibold lowercase">
                  markdown supported
                </span>
              </div>
              
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  broadcastAction('editing notes')
                }}
                onBlur={() => broadcastAction(null)}
                placeholder="# Project Notes&#10;- task list&#10;- progress update"
                rows={18}
                className="w-full text-xs bg-black/5 dark:bg-[#121216]/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-violet-500/50 font-mono resize-none leading-relaxed"
              />
            </Card>
          )}

          {/* ==================== 4. REFERENCES TAB ==================== */}
          {activeTab === 'references' && (
            <Card className="p-6 space-y-4 max-w-4xl mx-auto">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                Reference Links & Notes
              </span>
              <textarea
                value={references}
                onChange={(e) => {
                  setReferences(e.target.value)
                  broadcastAction('updating links')
                }}
                onBlur={() => broadcastAction(null)}
                placeholder="links, research URLs, and reading references for the project..."
                rows={12}
                className="w-full text-xs bg-black/5 dark:bg-[#121216]/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-violet-500/50 font-medium resize-none leading-relaxed"
              />
            </Card>
          )}

          {/* ==================== 5. ACTIVITY FEED TAB ==================== */}
          {activeTab === 'activity' && (
            <Card className="p-6 space-y-4 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                Real-time Workspace Activity Feed
              </span>
              
              {activities.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ActivityIcon className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-xs font-semibold">No workspace actions recorded.</p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-black/5 dark:before:bg-white/5 pt-2">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-4 relative animate-fadeIn">
                      <div className="h-6.5 w-6.5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 z-10 bg-white dark:bg-[#1c1f26]">
                        <GitCommit className="h-3.5 w-3.5 text-violet-500" />
                      </div>
                      <div className="space-y-1 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-violet-500 lowercase">@{act.user_name}</span>
                          <span className="text-[10px] font-bold bg-black/5 dark:bg-white/5 text-gray-400 px-2 py-0.5 rounded-md uppercase tracking-wider text-[8px]">{act.activity_type.replace('_', ' ')}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed leading-normal">
                          {act.description}
                        </p>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-bold">
                          {new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

        </div>

        {/* MODAL: MOOD SELECTOR */}
        {isCustomizingMood && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustomizingMood(false)} />
            <div className="relative w-full max-w-sm bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-scaleIn">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
                Select Workspace Mood
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {AVAILABLE_MOODS.map(m => (
                  <button
                    key={m.label}
                    onClick={() => handleSelectMood(m.label, m.emoji)}
                    className="p-3 bg-black/5 dark:bg-white/5 hover:bg-violet-600/10 hover:text-violet-500 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border border-transparent hover:border-violet-500/20"
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: WORKSPACE APPEARANCE CUSTOMIZER */}
        {isCustomizingAppearance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustomizingAppearance(false)} />
            <div className="relative w-full max-w-lg bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn max-h-[90vh] overflow-y-auto scrollbar-thin">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
                Customize Workspace Theme & Banner
              </h3>

              <div className="space-y-5 mt-4 text-xs font-semibold">
                {/* Accent Colors */}
                <div>
                  <label className="text-gray-400 block mb-2">Accent Style Color</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => handleSelectAccent(c.hex)}
                        className={`h-7 px-3 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer ${c.bg} ${accentColor === c.hex ? 'ring-2 ring-white ring-offset-2' : ''}`}
                        title={c.name}
                      >
                        {accentColor === c.hex && <Check className="h-3 w-3" />}
                        <span>{c.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Presets */}
                <div>
                  <label className="text-gray-400 block mb-2">Banner Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BANNER_PRESETS.map(b => (
                      <button
                        key={b.name}
                        onClick={() => handleSelectBannerPreset(b.url)}
                        className={`relative h-16 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 text-left p-2 cursor-pointer group hover:scale-[1.01] transition-all`}
                      >
                        <img src={b.url} alt={b.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-all" />
                        <span className="absolute bottom-1 left-2 bg-black/60 py-0.5 px-2 rounded-md text-[9px] font-bold text-white">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL Input */}
                <div>
                  <label className="text-gray-400 block mb-1">Custom Banner Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={customBannerUrlInput}
                      onChange={(e) => setCustomBannerUrlInput(e.target.value)}
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleSelectCustomBanner}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TASK CREATOR */}
        {isNewTaskModalOpen && (
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
        )}

        {/* MODAL: ADD CONTRIBUTOR */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
            <div className="relative w-full max-w-sm bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-scaleIn">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
                Invite Workspace Contributor
              </h3>

              <form onSubmit={handleInviteContributor} className="space-y-4 mt-4 text-xs font-semibold">
                <div>
                  <label className="text-gray-400 block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter crew username..."
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
                    autoFocus
                  />
                  {inviteError && (
                    <p className="text-[10px] text-rose-500 mt-1.5 font-sans font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{inviteError}</span>
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
                  >
                    Add to Crew
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FLOATING DRAGGABLE FOCUS ISLAND (COMPLETELY CURVED & ADJUSTABLE SIZE) */}
        {isFocusModalOpen && (
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              transform: `translate(${islandPosition.x}px, ${islandPosition.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
            className={`fixed bottom-6 right-6 z-50 select-none cursor-grab active:cursor-grabbing backdrop-blur-xl border border-violet-500/20 shadow-[0_15px_40px_rgba(124,58,237,0.25)] dark:bg-[#120e1e]/90 bg-[#faf8f5]/95 text-center transition-all ${
              islandSize === 'compact' 
                ? 'w-48 h-12 rounded-full px-3 py-1 flex items-center justify-between gap-1.5' 
                : 'w-72 rounded-[28px] p-5 flex flex-col gap-3.5'
            }`}
          >
            {/* COMPACT PILL MODE */}
            {islandSize === 'compact' && (
              <>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isFocusActive ? 'bg-purple-500 animate-ping' : 'bg-amber-500'}`} />
                  <span className="font-mono text-xs font-bold text-gray-800 dark:text-white">
                    {Math.floor(focusTimeRemaining / 60)}:{(focusTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {isFocusActive ? (
                    <button
                      onClick={handlePauseFocusSession}
                      className="p-1 text-amber-500 hover:bg-amber-500/10 rounded-full cursor-pointer"
                      title="Pause focus"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleStartFocusSession}
                      className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-full cursor-pointer"
                      title="Resume focus"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsIslandSize('expanded')}
                    className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-full cursor-pointer"
                    title="Expand controls"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}

            {/* EXPANDED PANEL MODE */}
            {islandSize === 'expanded' && (
              <>
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-violet-400 uppercase tracking-widest font-black">Focus Island</span>
                    {isFocusActive && <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsIslandSize('compact')}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      title="Contract to capsule"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsFocusModalOpen(false)}
                      className="p-1 text-gray-400 hover:text-rose-500 cursor-pointer"
                      title="Close focus mode"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                  </div>
                </div>

                {!isFocusActive && focusTimeRemaining === 0 ? (
                  <div className="space-y-3.5 text-left text-xs font-semibold">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold block mb-1">Focus Target Goal</label>
                      <input
                        type="text"
                        placeholder="e.g. Debug WebSocket presence..."
                        value={focusGoal}
                        onChange={(e) => setFocusGoal(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-gray-850 dark:text-white focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold block mb-1.5">Duration</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[10, 25, 50].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setFocusDuration(mins)}
                            className={`py-1.5 rounded-xl font-bold cursor-pointer text-center text-[10px] ${
                              focusDuration === mins 
                                ? 'bg-violet-600 border-transparent text-white shadow-md' 
                                : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartFocusSession}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md mt-2"
                    >
                      Start Focus Session
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 font-bold block capitalize">target: {focusGoal || 'Workspace Tasks'}</span>
                      <h1 className="text-3xl font-black font-mono text-gray-900 dark:text-white tracking-widest">
                        {Math.floor(focusTimeRemaining / 60)}:{(focusTimeRemaining % 60).toString().padStart(2, '0')}
                      </h1>
                    </div>

                    <div className="flex justify-center gap-2">
                      {isFocusActive ? (
                        <button
                          onClick={handlePauseFocusSession}
                          className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-full cursor-pointer transition-all border border-amber-500/20"
                          title="Pause"
                        >
                          <Pause className="h-4.5 w-4.5" />
                        </button>
                      ) : (
                        <button
                          onClick={handleStartFocusSession}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-full cursor-pointer transition-all border border-emerald-500/20"
                          title="Resume"
                        >
                          <Play className="h-4.5 w-4.5" />
                        </button>
                      )}

                      <button
                        onClick={handleStopFocusSession}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full cursor-pointer transition-all border border-rose-500/20"
                        title="Stop"
                      >
                        <Square className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* FILE CREATION MODAL */}
        {isNewFileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewFileModalOpen(false)} />
            <div className="relative w-full max-w-md bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-scaleIn">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
                create workspace file
              </h3>

              <form onSubmit={handleCreateFile} className="space-y-4 mt-4 text-xs font-semibold">
                <div>
                  <label className="text-gray-400 block mb-1">File Name (include extension)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. app.js, main.py, styles.css"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50 font-mono"
                    autoFocus
                  />
                  {newFileError && (
                    <p className="text-[10px] text-rose-500 mt-1.5 font-sans font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{newFileError}</span>
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsNewFileModalOpen(false)}
                    className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </div>
  )
}
