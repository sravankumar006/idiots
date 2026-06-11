'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export interface Project {
  id: string
  name: string
  description: string
  tech_stack: string[]
  progress: number
  github_url: string
  live_url: string
  notes: string
  references_text: string
  deadline: string | null
  created_by: string
  created_at: string
  contributors?: string[]
}

const DEFAULT_PROJECTS = (userId: string): Project[] => [
  {
    id: 'p1',
    name: 'idiots-project',
    description: 'Foundation repository for Next.js 16 and Supabase project setup, auth middleware, and glassmorphic UI systems.',
    tech_stack: ['Next.js', 'Supabase', 'TypeScript', 'TailwindCSS'],
    progress: 60,
    github_url: 'https://github.com/sravankumar006/idiots',
    live_url: 'https://idiots.space',
    notes: `### Idiots Project Notes
This is our primary codebase!
- Setup Supabase replication
- Build collaborative Pomodoro
- Add Multimodal AI Companion`,
    references_text: 'Supabase JS docs: https://supabase.com/docs/reference/javascript',
    deadline: new Date(Date.now() + 3600000 * 24 * 7).toISOString(), // 7 days from now
    created_by: userId,
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString()
  },
  {
    id: 'p2',
    name: 'is-design-system',
    description: 'Harmonious colors, responsive grid panels, custom animations, and typography configurations for warm cyber environments.',
    tech_stack: ['React', 'CSS Modules', 'Lucide Icons'],
    progress: 80,
    github_url: 'https://github.com/sravankumar006/is-design-system',
    live_url: '',
    notes: `### IS Design System Ideas
Let's keep visuals extremely premium:
- Glow text shadows
- Cream/sepia study mode filters
- Soft glassmorphism cards`,
    references_text: 'Glassmorphism generator link',
    deadline: null,
    created_by: userId,
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString()
  }
]

export function useProjectsData(activeUser: UserProfile | null) {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  
  const supabase = createClient()
  const userId = activeUser?.id

  const fetchProjects = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const storageKey = `mock_projects_${userId}`

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setProjects(data as Project[])
      } else {
        const defs = DEFAULT_PROJECTS(userId)
        // Attempt seed
        await supabase.from('projects').insert(defs)
        setProjects(defs)
      }
    } catch (err: any) {
      console.warn("DB Projects Fetch failed, using localStorage fallback:", err.message)
      
      const localProjects = localStorage.getItem(storageKey)
      if (localProjects) {
        setProjects(JSON.parse(localProjects))
      } else {
        const defs = DEFAULT_PROJECTS(userId)
        localStorage.setItem(storageKey, JSON.stringify(defs))
        setProjects(defs)
      }
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (userId) {
      fetchProjects()
    }
  }, [userId, fetchProjects])

  // Create Project
  const createProject = async (
    name: string,
    description: string,
    techStack: string[],
    githubUrl: string
  ) => {
    if (!userId) return null

    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      tech_stack: techStack,
      progress: 0,
      github_url: githubUrl,
      live_url: '',
      notes: `### ${name} Workspace\nGet started by adding project details or notes here!`,
      references_text: '',
      deadline: null,
      created_by: userId,
      created_at: new Date().toISOString()
    }

    setProjects((prev) => [newProject, ...prev])

    // Save to DB
    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          id: newProject.id,
          name,
          description,
          tech_stack: techStack,
          progress: 0,
          github_url: githubUrl,
          notes: newProject.notes,
          created_by: userId
        })
      if (error) throw error

      // Automatic milestone log: project created
      const projectCount = projects.length
      const isFirst = projectCount === 0
      await supabase.from('memories').insert({
        created_by: userId,
        user_id: userId,
        title: isFirst ? `First Crew Project Created: ${name} 🚀` : `New Project Launched: ${name} 💻`,
        description: isFirst
          ? `We kicked off our very first collaborative project workspace: ${name}! Let's build something epic.`
          : `A new creative space for ${name} was initialized with tech stack: ${techStack.join(', ')}.`,
        memory_type: 'project',
        type: 'milestone',
        visibility: 'public',
        related_users: [activeUser?.username || 'crew']
      })

    } catch (err: any) {
      console.warn("DB Create Project failed, using localStorage fallback:", err.message)
      const storageKey = `mock_projects_${userId}`
      const current = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updated = [newProject, ...current]
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }

    return newProject
  }

  // Update Project
  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!userId) return

    const currentProj = projects.find((p) => p.id === id)
    const prevProgress = currentProj?.progress || 0

    setProjects((prev) =>
      prev.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj))
    )

    // Save to DB
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
      if (error) throw error

      // Automatic milestone log: progress benchmarks
      if (updates.progress !== undefined) {
        const nextProgress = updates.progress
        const name = currentProj?.name || 'project'

        if (prevProgress < 100 && nextProgress === 100) {
          await supabase.from('memories').insert({
            created_by: userId,
            user_id: userId,
            title: `Mission Accomplished: ${name} Completed! 🏆`,
            description: `We fully completed the project "${name}" and reached 100% progress! Outstanding effort from the crew.`,
            memory_type: 'project',
            type: 'milestone',
            visibility: 'public',
            related_users: [activeUser?.username || 'crew']
          })
        } else if (prevProgress < 50 && nextProgress >= 50 && nextProgress < 100) {
          await supabase.from('memories').insert({
            created_by: userId,
            user_id: userId,
            title: `Project Milestone: ${name} at 50% 📈`,
            description: `The project "${name}" is halfway done! Pushing ahead to the finish line.`,
            memory_type: 'project',
            type: 'milestone',
            visibility: 'public',
            related_users: [activeUser?.username || 'crew']
          })
        }
      }
    } catch (err: any) {
      console.warn("DB Update Project failed, using localStorage fallback:", err.message)
      const storageKey = `mock_projects_${userId}`
      const current = JSON.parse(localStorage.getItem(storageKey) || '[]') as Project[]
      const updated = current.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj))
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }
  }

  const getProjectDetail = useCallback((id: string): Project | undefined => {
    return projects.find((p) => p.id === id)
  }, [projects])

  return {
    loading,
    projects,
    createProject,
    updateProject,
    getProjectDetail,
    refetch: fetchProjects
  }
}
