import { createClient } from '@/lib/supabase/client'

export async function fetchGitHubRepoSync(githubUrl: string): Promise<any> {
  const res = await fetch(`/api/github?repoUrl=${encodeURIComponent(githubUrl)}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sync project details')
  }
  return data
}

export async function sendAiQuery(body: {
  prompt: string
  groupId: string
  contextMessages: { type: string; message: string }[]
  providerPreference: string
}): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!response.ok || !response.body) {
    throw new Error('AI query failed.')
  }
  return response.body
}

export async function getCurrentUser(): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) return { success: true, data: null }
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || 'Active Node',
        avatar: user.user_metadata?.avatar || 'avatar-cyber-ghost',
        created_at: user.created_at
      }
    }
  } catch (error) {
    console.error('Error fetching current user session:', error)
    return { success: false, error }
  }
}
