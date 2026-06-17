'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage, UserProfile, ChatReaction, MessageSeen } from '@/types'
import { fetchMessages } from '@/lib/chat/fetchMessages'
import { subscribeToMessages } from '@/lib/chat/subscribeToMessages'

export function useRealtimeMessages(groupId: string, activeUser: UserProfile | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)
  
  const supabase = createClient()
  const profileCache = useRef<Record<string, UserProfile>>({})
  
  // Realtime buffer structures to queue events while fetching history
  const isHistoryLoadedRef = useRef(false)
  const realtimeBufferRef = useRef<Array<{
    type: 'INSERT' | 'UPDATE' | 'REACTION_INSERT' | 'REACTION_DELETE' | 'SEEN_INSERT'
    payload: any
  }>>([])

  // Fetch/cache user profiles to join realtime events
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | undefined> => {
    if (profileCache.current[userId]) {
      return profileCache.current[userId]
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data && !error) {
        profileCache.current[userId] = data as UserProfile
        return data as UserProfile
      }
    } catch (e) {
      console.warn("Could not fetch profile for user:", userId)
    }
    return undefined
  }, [supabase])

  // Helper to mark messages as seen in database
  const markMessagesAsSeen = useCallback(async (list: ChatMessage[]) => {
    if (!activeUser || isFallback || list.length === 0) return

    const unseenIds = list
      .filter(m => m.sender_id !== activeUser.id && m.sender_id !== '00000000-0000-0000-0000-000000000000' && !m.message_seen?.some(s => s.user_id === activeUser.id))
      .map(m => m.id)

    if (unseenIds.length > 0) {
      const inserts = unseenIds.map(msgId => ({
        message_id: msgId,
        user_id: activeUser.id
      }))

      try {
        const { error } = await supabase.from('message_seen').insert(inserts)
        if (error) throw error
      } catch (err) {
        console.warn("Failed to mark messages as seen:", err)
      }
    }
  }, [activeUser, isFallback, supabase])

  // Helper to apply a single realtime message insert to the array
  const applyMessageInsert = useCallback(async (newMsg: ChatMessage, list: ChatMessage[]): Promise<ChatMessage[]> => {
    const existingIndex = list.findIndex((m) => m.id === newMsg.id)
    if (existingIndex !== -1 && !list[existingIndex].sending) {
      return list
    }

    const senderProfile = await fetchProfile(newMsg.sender_id)
    const messageWithProfile: ChatMessage = {
      ...newMsg,
      profiles: senderProfile || newMsg.profiles,
      reactions: newMsg.reactions || [],
      message_seen: newMsg.message_seen || []
    }

    // Resolve parent reply
    if (newMsg.reply_to) {
      const parent = list.find((m) => m.id === newMsg.reply_to)
      if (parent) {
        messageWithProfile.replied_message = {
          id: parent.id,
          message: parent.message,
          sender_name: parent.profiles?.username || 'Explorer'
        }
      }
    }

    // Remove any temporary sending copy of the same message content, then append
    const filtered = list.filter((m) => 
      m.id !== newMsg.id && 
      !(m.sending && m.sender_id === newMsg.sender_id && m.message === newMsg.message)
    )
    return [...filtered, messageWithProfile]
  }, [fetchProfile])

  // Helper to apply a single reaction insert
  const applyReactionInsert = useCallback(async (reaction: ChatReaction, list: ChatMessage[]): Promise<ChatMessage[]> => {
    const rProfile = await fetchProfile(reaction.user_id)
    const reactionWithProfile = { ...reaction, profiles: rProfile || reaction.profiles }

    return list.map((msg) => {
      if (msg.id === reaction.message_id) {
        const currentReactions = msg.reactions || []
        if (currentReactions.some(r => r.id === reaction.id)) return msg
        return { ...msg, reactions: [...currentReactions, reactionWithProfile] }
      }
      return msg
    })
  }, [fetchProfile])

  // Helper to apply a single seen insert
  const applySeenInsert = useCallback(async (seen: MessageSeen, list: ChatMessage[]): Promise<ChatMessage[]> => {
    const sProfile = await fetchProfile(seen.user_id)
    const seenWithProfile = { ...seen, profiles: sProfile || seen.profiles }

    return list.map((msg) => {
      if (msg.id === seen.message_id) {
        const currentSeen = msg.message_seen || []
        if (currentSeen.some(s => s.user_id === seen.user_id)) return msg
        return { ...msg, message_seen: [...currentSeen, seenWithProfile] }
      }
      return msg
    })
  }, [fetchProfile])

  // ——— Desktop Notifications ———
  const showNotification = useCallback((message: ChatMessage) => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible') return // only when tab is hidden

    const senderName = message.profiles?.username || 'someone'
    const body = message.type === 'ai'
      ? 'AI companion replied'
      : message.type === 'text' || !message.type
      ? (message.message || 'New message')
      : `sent a ${message.type}`

    try {
      const n = new Notification(`💬 ${senderName}`, {
        body,
        icon: '/favicon.ico',
        tag: `chat-${groupId}`, // replace previous notification for same group
      } as NotificationOptions)
      n.onclick = () => {
        window.focus()
        n.close()
      }
    } catch (e) {
      // Notifications not supported or blocked
    }
  }, [groupId])

  // Request notification permission once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // Main lifecycle
  useEffect(() => {
    let active = true
    setIsLoading(true)
    isHistoryLoadedRef.current = false
    realtimeBufferRef.current = []

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isMock = !uuidRegex.test(groupId)

    let channel: any = null

    // 1. Subscribe to realtime first (if not mock)
    if (!isMock) {
      channel = subscribeToMessages(supabase, groupId, {
        onInsertMessage: async (newMsg) => {
          if (!isHistoryLoadedRef.current) {
            realtimeBufferRef.current.push({ type: 'INSERT', payload: newMsg })
          } else {
            // Fetch profile first asynchronously
            const senderProfile = await fetchProfile(newMsg.sender_id)

            // Trigger notification for messages from other users
            if (activeUser && newMsg.sender_id !== activeUser.id) {
              showNotification({
                ...newMsg,
                profiles: senderProfile || newMsg.profiles
              })
            }

            if (active) {
              setMessages((prev) => {
                const existingIndex = prev.findIndex((m) => m.id === newMsg.id)
                if (existingIndex !== -1 && !prev[existingIndex].sending) {
                  return prev
                }

                const messageWithProfile: ChatMessage = {
                  ...newMsg,
                  profiles: senderProfile || newMsg.profiles,
                  reactions: newMsg.reactions || [],
                  message_seen: newMsg.message_seen || []
                }

                if (newMsg.reply_to) {
                  const parent = prev.find((m) => m.id === newMsg.reply_to)
                  if (parent) {
                    messageWithProfile.replied_message = {
                      id: parent.id,
                      message: parent.message,
                      sender_name: parent.profiles?.username || 'Explorer'
                    }
                  }
                }

                // Filter out the optimistic version (match by ID or sender content match)
                const filtered = prev.filter((m) => 
                  m.id !== newMsg.id && 
                  !(m.sending && m.sender_id === newMsg.sender_id && m.message === newMsg.message)
                )

                const updated = [...filtered, messageWithProfile]
                // Mark as seen asynchronously
                markMessagesAsSeen(updated)
                return updated
              })
            }
          }
        },
        onUpdateMessage: (updatedMsg) => {
          if (!isHistoryLoadedRef.current) {
            realtimeBufferRef.current.push({ type: 'UPDATE', payload: updatedMsg })
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            )
          }
        },
        onReactionChange: async (event, reaction) => {
          if (!isHistoryLoadedRef.current) {
            realtimeBufferRef.current.push({
              type: event === 'INSERT' ? 'REACTION_INSERT' : 'REACTION_DELETE',
              payload: reaction
            })
          } else {
            if (event === 'INSERT') {
              const rProfile = await fetchProfile(reaction.user_id)
              if (active) {
                setMessages((prev) => {
                  const reactionWithProfile = { ...reaction, profiles: rProfile || reaction.profiles }
                  return prev.map((msg) => {
                    if (msg.id === reaction.message_id) {
                      const currentReactions = msg.reactions || []
                      if (currentReactions.some(r => r.id === reaction.id)) return msg
                      return { ...msg, reactions: [...currentReactions, reactionWithProfile] }
                    }
                    return msg
                  })
                })
              }
            } else {
              setMessages((prev) =>
                prev.map((msg) => {
                  const currentReactions = msg.reactions || []
                  if (currentReactions.some((r) => r.id === reaction.id)) {
                    return {
                      ...msg,
                      reactions: currentReactions.filter((r) => r.id !== reaction.id)
                    }
                  }
                  return msg
                })
              )
            }
          }
        },
        onSeenChange: async (seen) => {
          if (!isHistoryLoadedRef.current) {
            realtimeBufferRef.current.push({ type: 'SEEN_INSERT', payload: seen })
          } else {
            const sProfile = await fetchProfile(seen.user_id)
            if (active) {
              setMessages((prev) => {
                const seenWithProfile = { ...seen, profiles: sProfile || seen.profiles }
                return prev.map((msg) => {
                  if (msg.id === seen.message_id) {
                    const currentSeen = msg.message_seen || []
                    if (currentSeen.some(s => s.user_id === seen.user_id)) return msg
                    return { ...msg, message_seen: [...currentSeen, seenWithProfile] }
                  }
                  return msg
                })
              })
            }
          }
        },
        onAIStream: (messageId, text) => {
          setMessages(prev => {
            const exists = prev.some(m => m.id === messageId)
            if (exists) {
              return prev.map(m => m.id === messageId ? { ...m, message: text } : m)
            } else {
              // Placeholder if we receive stream before history or before sender's insert
              const newAiMsg: ChatMessage = {
                id: messageId,
                group_id: groupId,
                sender_id: '00000000-0000-0000-0000-000000000000',
                message: text,
                type: 'ai',
                reply_to: null,
                created_at: new Date().toISOString(),
                profiles: {
                  id: '00000000-0000-0000-0000-000000000000',
                  username: 'IS AI',
                  email: 'ai@system.local',
                  avatar: 'avatar-cyber-ghost',
                  created_at: new Date().toISOString()
                },
                sending: true
              }
              return [...prev, newAiMsg]
            }
          })
        }
      })
    }

    // 2. Fetch history from Database or fallback
    const initData = async () => {
      const { messages: history, isFallback: fallback } = await fetchMessages(supabase, groupId, activeUser)

      if (!active) return

      setIsFallback(fallback)

      // 3. Process any buffered realtime updates sequentially
      let mergedMessages = [...history]

      for (const event of realtimeBufferRef.current) {
        if (event.type === 'INSERT') {
          mergedMessages = await applyMessageInsert(event.payload, mergedMessages)
        } else if (event.type === 'UPDATE') {
          mergedMessages = mergedMessages.map((m) =>
            m.id === event.payload.id ? { ...m, ...event.payload } : m
          )
        } else if (event.type === 'REACTION_INSERT') {
          mergedMessages = await applyReactionInsert(event.payload, mergedMessages)
        } else if (event.type === 'REACTION_DELETE') {
          mergedMessages = mergedMessages.map((msg) => {
            const currentReactions = msg.reactions || []
            if (currentReactions.some((r) => r.id === event.payload.id)) {
              return {
                ...msg,
                reactions: currentReactions.filter((r) => r.id !== event.payload.id)
              }
            }
            return msg
          })
        } else if (event.type === 'SEEN_INSERT') {
          mergedMessages = await applySeenInsert(event.payload, mergedMessages)
        }
      }

      setMessages(mergedMessages)
      isHistoryLoadedRef.current = true
      realtimeBufferRef.current = []
      setIsLoading(false)

      // Mark fetched history messages as seen
      markMessagesAsSeen(mergedMessages)
    }

    // Automatically re-fetch database history on reconnect to close any disconnection gaps
    const handleOnline = () => {
      initData()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
    }

    initData()

    return () => {
      active = false
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
      }
    }
  }, [groupId, activeUser, supabase, applyMessageInsert, applyReactionInsert, applySeenInsert, markMessagesAsSeen, showNotification])

  return {
    messages,
    setMessages,
    isLoading,
    isFallback
  }
}
export default useRealtimeMessages
