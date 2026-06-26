import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/types'
import { useProjectsData } from '@/hooks/useProjectsData'
import { useProjectFiles } from '@/hooks/useProjectFiles'
import { useWorkspacePresence } from '@/hooks/useWorkspacePresence'
import { useWorkspaceDetails } from '@/hooks/useWorkspaceDetails'
import { TabId, TimelineItem } from '../types/creative-room.types'
import { fetchGitHubRepoSync, sendAiQuery, getCurrentUser } from '../services/creative-room.service'
import {
  Sparkles,
  CheckCircle2,
  Activity as ActivityIcon,
  FileCode,
  Users,
  Clock
} from 'lucide-react'

export function useCreativeRoomState(id: string) {
  const router = useRouter()
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Auth User Session Fetch
  useEffect(() => {
    const getSession = async () => {
      const res = await getCurrentUser()
      if (res.success && res.data) {
        setActiveUser(res.data as UserProfile)
      }
    }
    getSession()
  }, [])

  // Projects Hooks
  const {
    loading: projectLoading,
    getProjectDetail,
    updateProject
  } = useProjectsData(activeUser)

  const project = getProjectDetail(id)

  // Files Hook
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

  // GitHub repo sync state
  const [syncData, setSyncData] = useState<any>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    if (!githubUrl) {
      setSyncData(null)
      setSyncError(null)
      return
    }

    const fetchRepoSync = async () => {
      setSyncLoading(true)
      setSyncError(null)
      try {
        const data = await fetchGitHubRepoSync(githubUrl)
        setSyncData(data)
      } catch (err: any) {
        console.error("Repo sync fetch failed", err)
        setSyncError(err.message || 'GitHub API unavailable')
      } finally {
        setSyncLoading(false)
      }
    }
    fetchRepoSync()
  }, [githubUrl])

  // Focus Timer Clock ticking
  useEffect(() => {
    if (isFocusActive && focusTimeRemaining > 0) {
      focusTimerRef.current = setTimeout(() => {
        setFocusTimeRemaining(prev => prev - 1)
        if (focusSince) {
          updatePresenceStatus('focus', focusSince)
        }
      }, 1000)
    } else if (isFocusActive && focusTimeRemaining === 0) {
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

  // DRAGGING EVENT LISTENERS
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

  // SAVE WORKSPACE CONFIGURATION
  const handleSaveWorkspace = async () => {
    if (!project) return
    setIsSaving(true)

    saveCodeImmediately()
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

  const handleProgressChange = async (newVal: number) => {
    setProgress(newVal)
    if (!project) return
    await updateProject(project.id, { progress: newVal })
  }

  // APPEARANCE AND CUSTOMIZERS
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

  // FILE ACTIONS
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

  // TASK ACTIONS
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

  // CONTRIBUTOR INVITATION
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

  // FOCUS SESSION TIMER CONTROLS
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

  // CONTEXTUAL AI ASSISTANT PANEL
  const handleSendAiPrompt = async (e?: React.FormEvent, commandPrompt?: string) => {
    if (e) e.preventDefault()
    
    const text = commandPrompt || aiPrompt.trim()
    if (!text || isAiLoading || !activeUser || !project) return

    setAiPrompt('')
    setIsAiLoading(true)

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
      
      const body = {
        prompt: `${workspaceContext}\n\nUser Question/Command: ${text}`,
        groupId: id,
        contextMessages: aiMessages.slice(-8).map(m => ({ type: m.type, message: m.message })),
        providerPreference: providerPref
      }

      const stream = await sendAiQuery(body)
      const reader = stream.getReader()
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

  // Compile vertical timeline history
  const getTimelineItems = () => {
    const items: TimelineItem[] = []
    
    if (project) {
      items.push({
        id: 'creation',
        title: 'Workspace Created 🚀',
        description: `Room "${project.name}" was established.`,
        date: new Date(project.created_at),
        icon: Sparkles
      })
    }

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

    activities.forEach(act => {
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

    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const timelineItems = getTimelineItems()
  const stats = getStats()
  const health = getProjectHealth()
  const insights = getContributorInsights()

  return {
    id,
    router,
    activeUser,
    activeTab,
    setActiveTab,
    projectLoading,
    project,
    updateProject,
    filesLoading,
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    createFile,
    renameFile,
    deleteFile,
    updateFileContent,
    saveCodeImmediately,
    codeSaveStatus,
    codeLastSaved,
    notes,
    setNotes,
    references,
    setReferences,
    progress,
    githubUrl,
    setGithubUrl,
    liveUrl,
    setLiveUrl,
    isSaving,
    mood,
    icon,
    bannerUrl,
    accentColor,
    onlineUsers,
    actionAlerts,
    broadcastAction,
    updatePresenceStatus,
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
    getContributorInsights,
    isNewFileModalOpen,
    setIsNewFileModalOpen,
    newFileName,
    setNewFileName,
    newFileError,
    setNewFileError,
    renamingFileId,
    setRenamingFileId,
    renamingFileName,
    setRenamingFileName,
    renamingFileError,
    setRenamingFileError,
    isExplorerOpen,
    setIsExplorerOpen,
    isCustomizingMood,
    setIsCustomizingMood,
    isCustomizingAppearance,
    setIsCustomizingAppearance,
    customBannerUrlInput,
    setCustomBannerUrlInput,
    isNewTaskModalOpen,
    setIsNewTaskModalOpen,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    taskAssignee,
    setTaskAssignee,
    isInviteModalOpen,
    setIsInviteModalOpen,
    inviteName,
    setInviteName,
    inviteError,
    setInviteError,
    isFocusModalOpen,
    setIsFocusModalOpen,
    focusGoal,
    setFocusGoal,
    focusDuration,
    setFocusDuration,
    focusTimeRemaining,
    setFocusTimeRemaining,
    isFocusActive,
    setIsFocusActive,
    focusSince,
    islandSize,
    setIsIslandSize,
    islandPosition,
    setIslandPosition,
    isDragging,
    editorTheme,
    setEditorTheme,
    editorFontSize,
    setEditorFontSize,
    isMinimapEnabled,
    setIsMinimapEnabled,
    aiPrompt,
    setAiPrompt,
    aiMessages,
    isAiLoading,
    aiChatEndRef,
    syncData,
    syncLoading,
    syncError,
    handleMouseDown,
    handleTouchStart,
    handleSaveWorkspace,
    handleProgressChange,
    handleSelectMood,
    handleSelectAccent,
    handleSelectBannerPreset,
    handleSelectCustomBanner,
    handleCreateFile,
    handleStartRename,
    handleSaveRename,
    handleDeleteFile,
    handleCreateTask,
    handleInviteContributor,
    handleStartFocusSession,
    handlePauseFocusSession,
    handleStopFocusSession,
    handleSendAiPrompt,
    handleTriggerAiCommand,
    timelineItems,
    stats,
    health,
    insights
  }
}
export type UseCreativeRoomStateReturn = ReturnType<typeof useCreativeRoomState>
