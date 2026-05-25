import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatWorkspaceClient from '@/components/chat/ChatWorkspaceClient'
import { UserProfile, ChatGroup } from '@/types'

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Hang out, share, and talk with your crew in real time.',
}

export default async function ChatPage() {
  const supabase = await createClient()

  // 1. Fetch user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const activeUser: UserProfile = {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || 'Active Node',
    avatar: user.user_metadata?.avatar || 'avatar-cyber-ghost',
    created_at: user.created_at,
  }

  // 2. Fetch active groups (channels) from database
  let initialGroups: ChatGroup[] = []
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('group_name', { ascending: true })

    if (data && !error) {
      initialGroups = data as ChatGroup[]
    }
  } catch (err) {
    console.warn("Supabase groups fetch failed (table may not exist yet). Fallback will be triggered on client side.")
  }

  return (
    <div className="h-screen overflow-hidden">
      <ChatWorkspaceClient
        activeUser={activeUser}
        initialGroups={initialGroups}
      />
    </div>
  )
}

