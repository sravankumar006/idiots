import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProfile, ChatGroup } from '@/types'
import FocusChatClient from './FocusChatClient'

export const metadata: Metadata = {
  title: 'Lounge Chat',
  description: 'Hang out, share, and study with your crew in full screen.',
}

export default async function FocusRoomChatPage() {
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

  // 2. Fetch the 'focus room' group
  let focusRoomGroup: ChatGroup | null = null
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('group_name', 'focus room')
      .maybeSingle()

    if (data && !error) {
      focusRoomGroup = data as ChatGroup
    }
  } catch (err) {
    console.warn("Supabase fetch failed for focus room group in full screen page.")
  }

  return (
    <div className="h-[100dvh] overflow-hidden">
      <FocusChatClient
        activeUser={activeUser}
        initialGroup={focusRoomGroup}
      />
    </div>
  )
}
