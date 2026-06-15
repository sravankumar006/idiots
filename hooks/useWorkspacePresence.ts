'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export type PresenceStatus = 'online' | 'away' | 'focus'

export interface PresenceState {
  userId: string
  username: string
  avatar: string
  status: PresenceStatus
  onlineAt: string
  currentAction: string | null
  focusSince: string | null
}

export function useWorkspacePresence(projectId: string | undefined, activeUser: UserProfile | null) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({})
  const [actionAlerts, setActionAlerts] = useState<Record<string, string>>({}) // username -> actionText

  const supabase = createClient()
  const channelRef = useRef<any>(null)
  
  // Track our own status internally to keep the channel synced
  const ownStatusRef = useRef<PresenceState>({
    userId: '',
    username: '',
    avatar: '',
    status: 'online',
    onlineAt: '',
    currentAction: null,
    focusSince: null
  })

  // Initialize self ref
  useEffect(() => {
    if (activeUser) {
      ownStatusRef.current = {
        userId: activeUser.id,
        username: activeUser.username,
        avatar: activeUser.avatar,
        status: ownStatusRef.current.status,
        onlineAt: new Date().toISOString(),
        currentAction: ownStatusRef.current.currentAction,
        focusSince: ownStatusRef.current.focusSince
      }
    }
  }, [activeUser])

  // Broadcast own live action to others in the room
  const broadcastAction = useCallback((actionText: string | null) => {
    if (!activeUser || !channelRef.current) return

    // Update ref
    ownStatusRef.current.currentAction = actionText

    // 1. Send broadcast event for immediate micro-interactions
    channelRef.current.send({
      type: 'broadcast',
      event: 'user_action',
      payload: {
        userId: activeUser.id,
        username: activeUser.username,
        actionText
      }
    })

    // 2. Update presence state metadata so it persists
    channelRef.current.track({
      userId: activeUser.id,
      username: activeUser.username,
      avatar: activeUser.avatar,
      status: ownStatusRef.current.status,
      onlineAt: ownStatusRef.current.onlineAt,
      currentAction: actionText,
      focusSince: ownStatusRef.current.focusSince
    }).catch((e: any) => console.warn("Presence update error:", e))
  }, [activeUser])

  // Update online / away / focus mode status
  const updatePresenceStatus = useCallback(async (
    status: PresenceStatus, 
    focusSince: string | null = null
  ) => {
    if (!activeUser || !channelRef.current) return

    ownStatusRef.current.status = status
    ownStatusRef.current.focusSince = focusSince

    try {
      await channelRef.current.track({
        userId: activeUser.id,
        username: activeUser.username,
        avatar: activeUser.avatar,
        status,
        onlineAt: ownStatusRef.current.onlineAt,
        currentAction: ownStatusRef.current.currentAction,
        focusSince
      })
    } catch (e) {
      console.warn("Presence track status error:", e)
    }
  }, [activeUser])

  useEffect(() => {
    if (!projectId || !activeUser) return

    const channel = supabase.channel(`workspace-presence:${projectId}`, {
      config: {
        presence: {
          key: activeUser.id,
        },
      },
    })

    channelRef.current = channel

    // 1. Listen for user action broadcasts
    channel.on('broadcast', { event: 'user_action' }, (payload: any) => {
      const { userId, username, actionText } = payload.payload
      if (userId === activeUser.id) return // skip self

      if (actionText) {
        setActionAlerts(prev => ({
          ...prev,
          [username]: actionText
        }))
      } else {
        setActionAlerts(prev => {
          const next = { ...prev }
          delete next[username]
          return next
        })
      }
    })

    // 2. Setup presence sync listeners
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const activeUsers: Record<string, PresenceState> = {}

        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key]
          if (presences && presences.length > 0) {
            activeUsers[key] = presences[0] as unknown as PresenceState
          }
        })

        setOnlineUsers(activeUsers)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user join
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Clean up action status of users who left
        if (leftPresences && leftPresences.length > 0) {
          const username = leftPresences[0].username
          setActionAlerts(prev => {
            const next = { ...prev }
            delete next[username]
            return next
          })
        }
      })

    // 3. Connect/Subscribe to presence channel
    channel.subscribe(async (subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        await channel.track({
          userId: activeUser.id,
          username: activeUser.username,
          avatar: activeUser.avatar,
          status: ownStatusRef.current.status,
          onlineAt: ownStatusRef.current.onlineAt,
          currentAction: ownStatusRef.current.currentAction,
          focusSince: ownStatusRef.current.focusSince
        })
      }
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [projectId, activeUser, supabase])

  return {
    onlineUsers,
    actionAlerts,
    broadcastAction,
    updatePresenceStatus
  }
}
