'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatWindow from '@/components/chat/ChatWindow'
import { UserProfile, ChatGroup } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface FocusChatClientProps {
  activeUser: UserProfile | null
  initialGroup: ChatGroup | null
}

export default function FocusChatClient({ activeUser, initialGroup }: FocusChatClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [group, setGroup] = useState<ChatGroup | null>(initialGroup)

  useEffect(() => {
    if (!group) {
      const getOrCreateGroup = async () => {
        try {
          const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('group_name', 'focus room')
            .maybeSingle()

          if (!error && data) {
            setGroup(data as ChatGroup)
          } else if (!data) {
            const { data: newGroup, error: createError } = await supabase
              .from('groups')
              .insert({
                group_name: 'focus room',
                created_by: activeUser?.id || 'sys'
              })
              .select()
              .single()

            if (!createError && newGroup) {
              setGroup(newGroup as ChatGroup)
            }
          }
        } catch (e) {
          console.warn("Failed to retrieve or seed group:", e)
        }
      }
      getOrCreateGroup()
    }
  }, [group, activeUser, supabase])

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-neo-bg">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-500 lowercase">establishing chat connection...</p>
      </div>
    )
  }

  return (
    <ChatWindow
      groupId={group.id}
      groupName={group.group_name}
      activeUser={activeUser}
      onBack={() => router.push('/focus')}
      showBackOnDesktop={true}
    />
  )
}
