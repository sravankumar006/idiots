'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage, ChatGroup, UserProfile, ChatReaction } from '@/types'
import { uploadFile } from '@/lib/storage/uploadFile'
import { getPublicUrl } from '@/lib/storage/getFileUrl'


// Fallback mock messages in case Supabase connection is down or tables are not created yet
const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'default-group': [
    {
      id: 'm1',
      group_id: 'default-group',
      sender_id: 'sys',
      message: 'Connection established. Welcome to Idiots Space (IS) group chat.',
      type: 'text',
      reply_to: null,
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      profiles: {
        id: 'sys',
        username: 'System Companion',
        email: 'sys@idiots.space',
        avatar: 'avatar-cyber-ghost',
        created_at: new Date().toISOString()
      },
      reactions: []
    },
    {
      id: 'm2',
      group_id: 'default-group',
      sender_id: 'np',
      message: 'Check out the new features! We have collapsible sidebars, a modular layout, Pomodoro timers, and emoji reactions.',
      type: 'text',
      reply_to: null,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      profiles: {
        id: 'np',
        username: 'Neon Pulse',
        email: 'neon@idiots.space',
        avatar: 'avatar-neon-pulse',
        created_at: new Date().toISOString()
      },
      reactions: [
        { id: 'r1', message_id: 'm2', user_id: 'sys', emoji: '✨', created_at: new Date().toISOString() }
      ]
    }
  ]
}

export function useMessages(groupId: string, activeUser: UserProfile | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  
  const supabase = createClient()
  const profileCache = useRef<Record<string, UserProfile>>({})

  // Fetch or cache profile details to populate realtime joins
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

  // 1. Fetch History
  useEffect(() => {
    let active = true
    setIsLoading(true)
    setReplyTo(null)

    const fetchHistory = async () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(groupId)) {
        if (active) {
          setIsFallback(true)
          setMessages(MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group'])
          setIsLoading(false)
        }
        return
      }

      try {
        // Attempt query
        const { data, error } = await supabase
          .from('messages')
          .select('*, profiles(*), reactions(*, profiles(*))')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })

        if (error) throw error

        if (active) {
          setIsFallback(false)
          // Populate profile cache
          const dbMessages = (data || []) as ChatMessage[]
          dbMessages.forEach(msg => {
            if (msg.profiles) {
              profileCache.current[msg.sender_id] = msg.profiles
            }
          })
          setMessages(dbMessages)
          setIsLoading(false)
        }
      } catch (err) {
        console.warn("Supabase messages query failed (tables may not exist yet). Falling back to mock simulation.", err)
        if (active) {
          setIsFallback(true)
          setMessages(MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group'])
          setIsLoading(false)
        }
      }
    }

    fetchHistory()

    return () => { active = false }
  }, [groupId, supabase])

  // 2. Realtime Subscriptions
  useEffect(() => {
    if (isFallback) return // Skip subscriptions in fallback simulation mode

    // Channel for messages & reactions postgres changes
    const channel = supabase.channel(`realtime-chat:${groupId}`)
      
      // Listen to new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage
          
          // Deduplicate if we already have it (inserted optimistically)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev
            }
            return prev
          })
 
          // Fetch profile and append
          const senderProfile = await fetchProfile(newMsg.sender_id)
          const messageWithProfile: ChatMessage = {
            ...newMsg,
            profiles: senderProfile,
            reactions: []
          }
 
          // If it replies to a parent message, lookup details
          if (newMsg.reply_to) {
            setMessages((prev) => {
              const parent = prev.find(m => m.id === newMsg.reply_to)
              if (parent) {
                messageWithProfile.replied_message = {
                  id: parent.id,
                  message: parent.message,
                  sender_name: parent.profiles?.username || 'Explorer'
                }
              }
              return [...prev.filter((m) => m.id !== newMsg.id && !m.sending), messageWithProfile]
            })
          } else {
            setMessages((prev) => [...prev.filter((m) => m.id !== newMsg.id && !m.sending), messageWithProfile])
          }
        }
      )
 
      // Listen to message updates (e.g. editing)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          )
        }
      )
 
      // Listen to reactions modifications
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const reaction = payload.new as ChatReaction
            const rProfile = await fetchProfile(reaction.user_id)
            const reactionWithProfile = { ...reaction, profiles: rProfile }
 
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === reaction.message_id) {
                  const currentReactions = msg.reactions || []
                  if (currentReactions.some(r => r.id === reaction.id)) return msg
                  return { ...msg, reactions: [...currentReactions, reactionWithProfile] }
                }
                return msg
              })
            )
          } else if (payload.eventType === 'DELETE') {
            const oldReaction = payload.old as { id: string }
            setMessages((prev) =>
              prev.map((msg) => {
                const currentReactions = msg.reactions || []
                if (currentReactions.some((r) => r.id === oldReaction.id)) {
                  return {
                    ...msg,
                    reactions: currentReactions.filter((r) => r.id !== oldReaction.id)
                  }
                }
                return msg
              })
            )
          }
        }
      )
      .subscribe()
 
    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, supabase, fetchProfile, isFallback])

  // 3. Send Message Action
  const sendMessage = async (
    text: string,
    fileInfo?: { file: File; type: string } | { stickerUrl: string; type: 'sticker' }
  ) => {
    if (!text.trim() && !fileInfo && !activeUser) return
    if (!activeUser) return

    const tempId = `opt-${Date.now()}`
    const isSticker = fileInfo && fileInfo.type === 'sticker'
    const hasFile = fileInfo && !isSticker

    // Create a local blob url for images/videos/pdfs so they preview instantly
    let localBlobUrl: string | null = null
    if (hasFile && fileInfo && 'file' in fileInfo) {
      localBlobUrl = URL.createObjectURL(fileInfo.file)
    } else if (isSticker && fileInfo && 'stickerUrl' in fileInfo) {
      localBlobUrl = fileInfo.stickerUrl
    }

    const file_name = hasFile && fileInfo && 'file' in fileInfo ? fileInfo.file.name : null
    const file_size = hasFile && fileInfo && 'file' in fileInfo ? fileInfo.file.size : null
    const message_type = fileInfo ? fileInfo.type : 'text'

    // Construct optimistic message
    const optMessage: ChatMessage = {
      id: tempId,
      group_id: groupId,
      sender_id: activeUser.id,
      message: text.trim() || (isSticker ? 'Sent a sticker' : (file_name || '')),
      type: message_type,
      file_url: localBlobUrl,
      file_name: file_name,
      file_size: file_size,
      reply_to: replyTo ? replyTo.id : null,
      created_at: new Date().toISOString(),
      profiles: activeUser,
      reactions: [],
      sending: true,
      uploadProgress: hasFile ? 0 : undefined,
      replied_message: replyTo 
        ? { id: replyTo.id, message: replyTo.message, sender_name: replyTo.profiles?.username || 'Explorer' } 
        : null
    }

    // Append optimistically
    setMessages((prev) => [...prev, optMessage])
    const activeReply = replyTo
    setReplyTo(null) // clear reply bar

    // If fallback mode, simulate upload progress then complete
    if (isFallback) {
      if (hasFile) {
        let currentProgress = 0
        const interval = setInterval(() => {
          currentProgress += 20
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, uploadProgress: currentProgress } : m
            )
          )
          if (currentProgress >= 100) {
            clearInterval(interval)
            setTimeout(() => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempId
                    ? { ...m, id: `msg-${Date.now()}`, sending: false, uploadProgress: undefined }
                    : m
                )
              )
            }, 300)
          }
        }, 150)
      } else {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? { ...m, id: `msg-${Date.now()}`, sending: false }
                : m
            )
          )
        }, 500)
      }
      return
    }

    try {
      let finalFileUrl: string | null = null

      if (hasFile && fileInfo && 'file' in fileInfo) {
        const file = fileInfo.file
        // Determine correct bucket based on type
        const bucket = fileInfo.type === 'pdf' ? 'documents' : 'chat-media'
        
        // Setup unique path name
        const fileId = crypto.randomUUID()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const path = `${fileId}_${safeFileName}`

        const storagePath = await uploadFile({
          bucket,
          path,
          file,
          onProgress: (p) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === tempId ? { ...m, uploadProgress: p } : m))
            )
          }
        })

        finalFileUrl = getPublicUrl(bucket, storagePath)

        // Revoke optimistic URL now that upload is complete
        if (localBlobUrl) {
          URL.revokeObjectURL(localBlobUrl)
        }
      } else if (isSticker && fileInfo && 'stickerUrl' in fileInfo) {
        finalFileUrl = fileInfo.stickerUrl
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          sender_id: activeUser.id,
          message: text.trim() || (isSticker ? 'Sent a sticker' : (file_name || '')),
          type: message_type,
          file_url: finalFileUrl,
          file_name: file_name,
          file_size: file_size,
          reply_to: activeReply ? activeReply.id : null
        })
        .select('*, profiles(*)')
        .single()

      if (error) throw error

      // Replace optimistic message in state with database single row return
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, ...data, sending: false, uploadProgress: undefined } : m))
      )
    } catch (e) {
      console.error("Error sending message:", e)
      // Revoke URL if error occurred
      if (localBlobUrl && hasFile) {
        URL.revokeObjectURL(localBlobUrl)
      }
      // Flag message as error
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, error: true, sending: false } : m))
      )
    }
  }

  // 4. Delete Message (soft-delete)
  const deleteMessage = async (messageId: string) => {
    if (!activeUser) return

    // Only allow deleting own messages
    const targetMsg = messages.find((m) => m.id === messageId)
    if (!targetMsg || targetMsg.sender_id !== activeUser.id) return

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, type: 'deleted', message: '' } : m
      )
    )

    if (isFallback) return // No-op in fallback mode

    try {
      await supabase
        .from('messages')
        .update({ type: 'deleted', message: '' })
        .eq('id', messageId)
        .eq('sender_id', activeUser.id) // RLS guard
    } catch (e) {
      console.error('Error deleting message:', e)
      // Revert optimistic update on failure
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? targetMsg : m
        )
      )
    }
  }

  // 5. Toggle Emoji Reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!activeUser) return

    const targetMsg = messages.find(m => m.id === messageId)
    if (!targetMsg) return

    const existingReaction = (targetMsg.reactions || []).find(
      r => r.user_id === activeUser.id && r.emoji === emoji
    )

    // Fallback simulation mode
    if (isFallback) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const current = msg.reactions || []
            if (existingReaction) {
              return { ...msg, reactions: current.filter(r => r.id !== existingReaction.id) }
            } else {
              const newR: ChatReaction = {
                id: `react-${Date.now()}`,
                message_id: messageId,
                user_id: activeUser.id,
                emoji,
                created_at: new Date().toISOString(),
                profiles: activeUser
              }
              return { ...msg, reactions: [...current, newR] }
            }
          }
          return msg
        })
      )
      return
    }

    try {
      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id)
      } else {
        // Insert reaction
        await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: activeUser.id,
            emoji
          })
      }
    } catch (e) {
      console.error("Error toggling reaction:", e)
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
    toggleReaction,
    deleteMessage,
    replyTo,
    setReplyTo
  }
}
export default useMessages
