'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export function useRealtimeChat(groupId: string, activeUser: UserProfile | null) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({})
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const [myFocus, setMyFocus] = useState<{
    isFocusing: boolean
    status: string
    focusSince: string | null
    isDeepFocus: boolean
  }>({
    isFocusing: false,
    status: '',
    focusSince: null,
    isDeepFocus: false
  })

  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const myFocusRef = useRef(myFocus)

  // Keep ref in sync to avoid channel recreation
  useEffect(() => {
    myFocusRef.current = myFocus
  }, [myFocus])

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

  // Update focus presence payload dynamically (no channel recreation)
  const updateFocusStatus = useCallback(async (isFocusing: boolean, status: string, isDeepFocus: boolean) => {
    if (!activeUser || !channelRef.current) return

    const focusSince = isFocusing ? (myFocusRef.current.focusSince || new Date().toISOString()) : null
    const nextFocus = { isFocusing, status, focusSince, isDeepFocus }
    setMyFocus(nextFocus)

    try {
      await channelRef.current.track({
        userId: activeUser.id,
        username: activeUser.username,
        avatar: activeUser.avatar,
        onlineAt: new Date().toISOString(),
        isFocusing,
        focusStatus: status,
        focusSince,
        isDeepFocus,
      })
    } catch (e) {
      console.warn("Presence track error:", e)
    }
  }, [activeUser])

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
        // Sync active user presence with initial/current focus state
        await channel.track({
          userId: activeUser.id,
          username: activeUser.username,
          avatar: activeUser.avatar,
          onlineAt: new Date().toISOString(),
          isFocusing: myFocusRef.current.isFocusing,
          focusStatus: myFocusRef.current.status,
          focusSince: myFocusRef.current.focusSince,
          isDeepFocus: myFocusRef.current.isDeepFocus,
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
    myFocus,
    updateFocusStatus,
  }
}
export default useRealtimeChat
