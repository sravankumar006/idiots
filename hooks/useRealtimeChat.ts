'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export function useRealtimeChat(groupId: string, activeUser: UserProfile | null) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({})
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  // Broadcast that active user is typing
  const sendTypingStatus = (isTyping: boolean) => {
    if (!activeUser || !channelRef.current) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: activeUser.id,
        username: activeUser.username,
        isTyping,
      },
    })
  }

  useEffect(() => {
    if (!activeUser) return

    // Create unique channel for the chat group
    const channel = supabase.channel(`group-activity:${groupId}`, {
      config: {
        presence: {
          key: activeUser.id,
        },
      },
    })

    channelRef.current = channel

    // 1. Listen for typing broadcasts
    channel.on('broadcast', { event: 'typing' }, (payload: any) => {
      const { userId, username, isTyping } = payload.payload
      if (userId === activeUser.id) return // ignore self
      
      setTypingUsers((prev) => ({
        ...prev,
        [username]: isTyping,
      }))
    })

    // 2. Track Presence changes (online members)
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const users: Record<string, any> = {}
        
        Object.keys(presenceState).forEach((key) => {
          const userPresences = presenceState[key]
          if (userPresences && userPresences.length > 0) {
            users[key] = userPresences[0]
          }
        })
        
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Option to display join notification banner
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Option to display leave notification banner
      })

    // 3. Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Sync active user presence
        await channel.track({
          userId: activeUser.id,
          username: activeUser.username,
          avatar: activeUser.avatar,
          onlineAt: new Date().toISOString(),
        })
      }
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [groupId, activeUser, supabase])

  return {
    onlineUsers,
    typingUsers,
    sendTypingStatus,
  }
}
export default useRealtimeChat
