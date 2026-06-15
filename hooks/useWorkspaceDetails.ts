'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export interface ProjectTask {
  id: string
  project_id: string
  title: string
  description: string
  completed: boolean
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
  assigned_username?: string // Joined username for display
}

export interface ProjectActivity {
  id: string
  project_id: string
  user_id: string | null
  user_name: string
  activity_type: string
  description: string
  created_at: string
}

export interface WorkspaceStats {
  files: number
  notes: number
  tasks: number
  contributors: number
  resources: number
  progress: number
  focusHours: number
}

export function useWorkspaceDetails(
  projectId: string | undefined,
  activeUser: UserProfile | null,
  filesCount: number,
  notesText: string,
  referencesText: string,
  progressValue: number
) {
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [contributors, setContributors] = useState<UserProfile[]>([])
  const [focusHours, setFocusHours] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const tasksRef = useRef<ProjectTask[]>([])
  const activitiesRef = useRef<ProjectActivity[]>([])
  const contributorsRef = useRef<UserProfile[]>([])

  useEffect(() => { tasksRef.current = tasks }, [tasks])
  useEffect(() => { activitiesRef.current = activities }, [activities])
  useEffect(() => { contributorsRef.current = contributors }, [contributors])

  const getTasksKey = useCallback(() => `mock_tasks_${projectId}`, [projectId])
  const getActivitiesKey = useCallback(() => `mock_activities_${projectId}`, [projectId])

  // --- 1. AUDIT ACTIVITY LOGGER ---
  const logActivity = useCallback(async (activityType: string, description: string) => {
    if (!projectId || !activeUser) return

    const newActivity: ProjectActivity = {
      id: crypto.randomUUID(),
      project_id: projectId,
      user_id: activeUser.id,
      user_name: activeUser.username,
      activity_type: activityType,
      description,
      created_at: new Date().toISOString()
    }

    // Update in-memory state
    setActivities(prev => [newActivity, ...prev].slice(0, 100))

    try {
      const { error } = await supabase
        .from('project_activities')
        .insert(newActivity)
      if (error) throw error
    } catch (err: any) {
      console.warn("DB log activity failed, using local storage cache:", err.message)
      const current = JSON.parse(localStorage.getItem(getActivitiesKey()) || '[]')
      const updated = [newActivity, ...current].slice(0, 100)
      localStorage.setItem(getActivitiesKey(), JSON.stringify(updated))
    }
  }, [projectId, activeUser, supabase, getActivitiesKey])

  // --- 2. NOTIFICATIONS TRIGGER ---
  const triggerNotification = useCallback(async (
    recipientId: string,
    title: string,
    body: string,
    type: string
  ) => {
    if (!projectId || !activeUser) return

    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          title,
          body,
          category: 'focus', // matching custom notification type
          type,
          related_id: projectId,
          is_read: false
        })
    } catch (e) {
      console.warn("DB notification dispatch failed:", e)
    }
  }, [projectId, activeUser, supabase])

  // --- 3. FETCH DATA OR SETUP REAL-TIME SYNC ---
  const fetchData = useCallback(async () => {
    if (!projectId || !activeUser) return
    setLoading(true)

    try {
      // A. Query contributors
      const { data: contribsData, error: contribsError } = await supabase
        .from('project_contributors')
        .select('user_id')
        .eq('project_id', projectId)

      if (contribsError) throw contribsError

      // Fetch profiles matching user ids, plus the project owner
      const { data: projectOwner } = await supabase
        .from('projects')
        .select('created_by')
        .eq('id', projectId)
        .single()

      const uids = (contribsData || []).map(c => c.user_id)
      if (projectOwner?.created_by && !uids.includes(projectOwner.created_by)) {
        uids.push(projectOwner.created_by)
      }

      if (uids.length > 0) {
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, username, avatar, email, created_at')
          .in('id', uids)

        if (!profError && profiles) {
          setContributors(profiles as UserProfile[])
        }
      } else {
        // Fallback: if no contributor records exist, seed the active user
        setContributors([activeUser])
      }

      // B. Query tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (tasksError) throw tasksError
      setTasks(tasksData as ProjectTask[])

      // C. Query activities
      const { data: actData, error: actError } = await supabase
        .from('project_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (actError) throw actError
      setActivities(actData as ProjectActivity[])

      // D. Query focus session hours
      const { data: focusSessions } = await supabase
        .from('focus_sessions')
        .select('actual_minutes')
        .eq('group_id', projectId)
        .eq('completed', true)

      if (focusSessions) {
        const totalMin = focusSessions.reduce((acc, curr) => acc + (curr.actual_minutes || 0), 0)
        setFocusHours(Math.round((totalMin / 60) * 10) / 10)
      }

    } catch (err: any) {
      console.warn("DB details load failed, loading from local fallback:", err.message)
      
      // Seed default active user as contributor
      setContributors([activeUser])

      // Tasks Fallback
      const localTasks = localStorage.getItem(getTasksKey())
      if (localTasks) {
        setTasks(JSON.parse(localTasks))
      } else {
        setTasks([])
      }

      // Activities Fallback
      const localAct = localStorage.getItem(getActivitiesKey())
      if (localAct) {
        setActivities(JSON.parse(localAct))
      } else {
        // Seed first activity
        const initActivity: ProjectActivity = {
          id: crypto.randomUUID(),
          project_id: projectId,
          user_id: activeUser.id,
          user_name: activeUser.username,
          activity_type: 'customization_change',
          description: `Established Creative Room workspace Node.`,
          created_at: new Date().toISOString()
        }
        localStorage.setItem(getActivitiesKey(), JSON.stringify([initActivity]))
        setActivities([initActivity])
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, activeUser, supabase, getTasksKey, getActivitiesKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Real-time updates subscription for activities ---
  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`project-details-realtime:${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_activities', filter: `project_id=eq.${projectId}` },
        (payload) => {
          const newAct = payload.new as ProjectActivity
          setActivities(prev => {
            if (prev.some(a => a.id === newAct.id)) return prev
            return [newAct, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_tasks', filter: `project_id=eq.${projectId}` },
        () => {
          // Re-fetch tasks dynamically on change
          supabase
            .from('project_tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })
            .then(({ data }) => {
              if (data) setTasks(data as ProjectTask[])
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, supabase])

  // --- 4. TASK MUTATORS (CRUD) ---
  const createTask = useCallback(async (title: string, description: string = '', assignedTo: string | null = null) => {
    if (!projectId || !activeUser) return null

    const newTask: ProjectTask = {
      id: crypto.randomUUID(),
      project_id: projectId,
      title,
      description,
      completed: false,
      assigned_to: assignedTo,
      created_by: activeUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedTasks = [...tasksRef.current, newTask]
    setTasks(updatedTasks)

    // Log Activity
    logActivity('task_create', `Created task: "${title}"`)

    // Save to DB
    try {
      const { error } = await supabase
        .from('project_tasks')
        .insert(newTask)
      if (error) throw error

      // Trigger notification if assigned
      if (assignedTo && assignedTo !== activeUser.id) {
        triggerNotification(
          assignedTo,
          'New Task Assignment 📋',
          `You have been assigned to: "${title}" in workspace room.`,
          'invitation'
        )
      }

      // Check for first task memory
      if (tasksRef.current.length === 1) {
        await triggerMilestoneMemory(
          'First Workspace Task Created! 📋',
          `We created the very first project task: "${title}". Time to start building!`
        )
      }

    } catch (err: any) {
      console.warn("DB Create task failed, using local fallback:", err.message)
      localStorage.setItem(getTasksKey(), JSON.stringify(updatedTasks))
    }

    return newTask;
  }, [projectId, activeUser, supabase, getTasksKey, logActivity, triggerNotification])

  const toggleTaskCompletion = useCallback(async (taskId: string, completed: boolean) => {
    const task = tasksRef.current.find(t => t.id === taskId)
    if (!task) return

    const updatedTasks = tasksRef.current.map(t => 
      t.id === taskId ? { ...t, completed, updated_at: new Date().toISOString() } : t
    )
    setTasks(updatedTasks)

    // Log activity
    logActivity(
      completed ? 'task_complete' : 'task_update', 
      completed ? `Completed task: "${task.title}"` : `Reopened task: "${task.title}"`
    )

    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', taskId)
      if (error) throw error

      // Trigger first task completed memory milestone
      if (completed) {
        const allCompleted = updatedTasks.filter(t => t.completed).length
        if (allCompleted === 1) {
          await triggerMilestoneMemory(
            'First Task Completed! 🏆',
            `Workspace milestone reached! We completed our very first task: "${task.title}".`
          )
        }
      }
    } catch (err: any) {
      console.warn("DB Update task failed, using local fallback:", err.message)
      localStorage.setItem(getTasksKey(), JSON.stringify(updatedTasks))
    }
  }, [supabase, getTasksKey, logActivity])

  const deleteTask = useCallback(async (taskId: string) => {
    const task = tasksRef.current.find(t => t.id === taskId)
    if (!task) return

    const updatedTasks = tasksRef.current.filter(t => t.id !== taskId)
    setTasks(updatedTasks)

    logActivity('task_delete', `Removed task: "${task.title}"`)

    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId)
      if (error) throw error
    } catch (err: any) {
      console.warn("DB Delete task failed, using local fallback:", err.message)
      localStorage.setItem(getTasksKey(), JSON.stringify(updatedTasks))
    }
  }, [supabase, getTasksKey, logActivity])

  // --- 5. LOG FOCUS SESSIONS ---
  const recordFocusSession = useCallback(async (minutes: number, goal: string) => {
    if (!projectId || !activeUser) return

    try {
      const newSession = {
        user_id: activeUser.id,
        goal,
        duration_minutes: minutes,
        actual_minutes: minutes,
        elapsed_seconds: minutes * 60,
        theme: 'minimal_zen',
        completed: true,
        is_deep_focus: true,
        group_id: projectId,
        points_earned: minutes * 10
      }

      await supabase
        .from('focus_sessions')
        .insert(newSession)

      // Add to local stats
      setFocusHours(prev => Math.round((prev + (minutes / 60)) * 10) / 10)

      // Log activity
      logActivity('focus_complete', `Completed ${minutes} min focus session on: "${goal}"`)
    } catch (e) {
      console.warn("Could not log focus session in DB:", e)
      // Log local activity
      logActivity('focus_complete', `Completed ${minutes} min focus session on: "${goal}" (Offline)`)
    }
  }, [projectId, activeUser, supabase, logActivity])

  // --- 6. ADD CONTRIBUTOR ---
  const inviteContributor = useCallback(async (username: string) => {
    if (!projectId || !activeUser) return

    try {
      // Find user profile by username
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileErr || !profile) {
        throw new Error(`User "${username}" was not found on this node.`)
      }

      // Add to contributors table
      const { error } = await supabase
        .from('project_contributors')
        .insert({
          project_id: projectId,
          user_id: profile.id
        })

      if (error) throw error

      // Refresh contributors
      setContributors(prev => {
        if (prev.some(p => p.id === profile.id)) return prev
        return [...prev, profile]
      })

      logActivity('contributor_add', `Added contributor: @${username}`)

      // Send recipient notification
      triggerNotification(
        profile.id,
        'Workspace Invitation 🚀',
        `You have been added as a contributor to workspace room.`,
        'invitation'
      )

      // Trigger first contributor memory
      if (contributorsRef.current.length === 1) {
        await triggerMilestoneMemory(
          'First Contributor Joined! 👥',
          `Collaborator @${username} joined the creative crew! Let's build together.`
        )
      }

    } catch (err: any) {
      throw new Error(err.message || 'Invitation failed.')
    }
  }, [projectId, activeUser, supabase, logActivity, triggerNotification])

  // --- 7. AUTOMATIC MILESTONE MEMORIES SYSTEM ---
  const triggerMilestoneMemory = async (title: string, description: string) => {
    if (!projectId || !activeUser) return

    try {
      const memoryObj = {
        user_id: activeUser.id,
        title,
        description,
        type: 'milestone',
        visibility: 'public',
        media_url: projectId // reuse media_url as identifier link to project
      }

      await supabase
        .from('memories')
        .insert(memoryObj)
      
      logActivity('milestone', `Reached milestone memory: ${title}`)
    } catch (e) {
      console.warn("DB memory milestone logging failed:", e)
    }
  }

  // --- 8. EVALUATE PROJECT HEALTH & STATS ---
  // Calculates statistics dynamically based on real data array sizes
  const getStats = (): WorkspaceStats => {
    // 1. Files count
    const files = filesCount
    
    // 2. Notes count: counts lines starting with "#" in notes plus any file ending in .md
    const mdLines = notesText.split('\n').filter(line => line.trim().startsWith('#')).length
    const mdFiles = filesCount > 0 ? filesCount : 0 // file numbers
    const notes = Math.max(1, mdLines)

    // 3. Tasks count
    const tasksCount = tasks.length

    // 4. Contributors count
    const contributorsCount = contributors.length

    // 5. Resources count: check reference lines that are urls or contain bullet points
    const resources = referencesText
      .split('\n')
      .filter(line => line.includes('http') || line.trim().startsWith('-') || line.trim().startsWith('*')).length

    return {
      files,
      notes,
      tasks: tasksCount,
      contributors: contributorsCount,
      resources,
      progress: progressValue,
      focusHours
    }
  }

  // Automated health status assessment
  const getProjectHealth = (): { status: 'active' | 'slowing' | 'dormant'; description: string } => {
    if (activities.length === 0) {
      return { status: 'dormant', description: 'No activity logs found. Start adding code or notes.' }
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const recentActivities = activities.filter(a => new Date(a.created_at) >= oneWeekAgo)
    const midActivities = activities.filter(a => new Date(a.created_at) >= twoWeeksAgo && new Date(a.created_at) < oneWeekAgo)

    if (recentActivities.length >= 3 || focusHours > 5) {
      return { status: 'active', description: 'Highly active. Contributor participation and updates logged this week.' }
    } else if (recentActivities.length > 0 || midActivities.length > 0) {
      return { status: 'slowing', description: 'Slowing down. Limited updates logged over the past two weeks.' }
    } else {
      return { status: 'dormant', description: 'Dormant. No workspace activity logged in the last 14 days.' }
    }
  }

  // --- 9. CONTRIBUTOR INSIGHTS ---
  const getContributorInsights = (): Record<string, { edits: number; tasks: number; uploads: number }> => {
    const insights: Record<string, { edits: number; tasks: number; uploads: number }> = {}

    // Seed all contributors
    contributors.forEach(c => {
      insights[c.username] = { edits: 0, tasks: 0, uploads: 0 }
    })

    // Walk activity logs to increment counts based on real user actions
    activities.forEach(act => {
      const username = act.user_name
      if (!insights[username]) {
        insights[username] = { edits: 0, tasks: 0, uploads: 0 }
      }

      if (act.activity_type.startsWith('file_update') || act.activity_type.startsWith('note_edit')) {
        insights[username].edits += 1
      } else if (act.activity_type.startsWith('task_')) {
        insights[username].tasks += 1
      } else if (act.activity_type.startsWith('upload')) {
        insights[username].uploads += 1
      }
    })

    return insights
  }

  return {
    loading,
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
  }
}
