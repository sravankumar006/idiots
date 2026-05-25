'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage, UserProfile, ChatReaction } from '@/types'
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
    type: 'INSERT' | 'UPDATE' | 'REACTION_INSERT' | 'REACTION_DELETE'
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
      reactions: newMsg.reactions || []
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

    // Remove any temporary sending copy, then append
    const filtered = list.filter((m) => m.id !== newMsg.id && !m.sending)
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
            setMessages((prev) => {
              let updated = [...prev]
              applyMessageInsert(newMsg, prev).then(res => {
                if (active) setMessages(res)
              })
              return prev // wait for async apply
            })
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
              setMessages((prev) => {
                applyReactionInsert(reaction, prev).then(res => {
                  if (active) setMessages(res)
                })
                return prev
              })
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
                sender_id: 'ai-system-stub',
                message: text,
                type: 'ai',
                reply_to: null,
                created_at: new Date().toISOString(),
                profiles: {
                  id: 'ai-system-stub',
                  username: 'idiot ai',
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
        }
      }

      setMessages(mergedMessages)
      isHistoryLoadedRef.current = true
      realtimeBufferRef.current = []
      setIsLoading(false)
    }

    initData()

    return () => {
      active = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [groupId, activeUser, supabase, applyMessageInsert, applyReactionInsert])

  return {
    messages,
    setMessages,
    isLoading,
    isFallback
  }
}
export default useRealtimeMessages
