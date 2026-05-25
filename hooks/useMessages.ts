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
      
      // Fallback check
      if (!uuidRegex.test(groupId)) {
        if (active) {
          setIsFallback(true)
          
          // Load messages from localStorage if exist
          const localMsgsKey = `fallback_messages_${groupId}`
          let localMsgs: ChatMessage[] = []
          try {
            const raw = localStorage.getItem(localMsgsKey)
            if (raw) {
              localMsgs = JSON.parse(raw)
            } else {
              localMsgs = MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group']
              localStorage.setItem(localMsgsKey, JSON.stringify(localMsgs))
            }
          } catch {
            localMsgs = MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group']
          }

          // Fetch local storage deletes & clears
          let clearedAt: string | null = null
          let deletedMsgIds: string[] = []
          try {
            clearedAt = localStorage.getItem(`clear_time_${groupId}`)
            deletedMsgIds = JSON.parse(localStorage.getItem(`deleted_msgs_${groupId}`) || '[]')
          } catch {}

          let filtered = localMsgs
          if (clearedAt) {
            filtered = filtered.filter(m => m.created_at > (clearedAt as string))
          }
          filtered = filtered.filter(m => !deletedMsgIds.includes(m.id))

          setMessages(filtered)
          setIsLoading(false)
        }
        return
      }

      try {
        // A. Fetch cleared_at timestamp for this user & group
        let clearedAt: string | null = null
        if (activeUser) {
          const { data: clearData } = await supabase
            .from('group_clears')
            .select('cleared_at')
            .eq('group_id', groupId)
            .eq('user_id', activeUser.id)
            .maybeSingle()
          
          if (clearData) {
            clearedAt = clearData.cleared_at
          }
        }

        // B. Fetch deleted message ids for this user
        let deletedMsgIds: string[] = []
        if (activeUser) {
          const { data: deletedData } = await supabase
            .from('deleted_messages')
            .select('message_id')
            .eq('user_id', activeUser.id)
          
          if (deletedData) {
            deletedMsgIds = deletedData.map(d => d.message_id)
          }
        }

        // C. Fetch main messages
        let query = supabase
          .from('messages')
          .select('*, profiles(*), reactions(*, profiles(*))')
          .eq('group_id', groupId)
        
        if (clearedAt) {
          query = query.gt('created_at', clearedAt)
        }

        const { data, error } = await query.order('created_at', { ascending: true })

        if (error) throw error

        if (active) {
          setIsFallback(false)
          const dbMessages = (data || []) as ChatMessage[]
          
          // Filter out deleted messages
          const filteredMessages = dbMessages.filter(msg => !deletedMsgIds.includes(msg.id))

          // Populate profile cache
          filteredMessages.forEach(msg => {
            if (msg.profiles) {
              profileCache.current[msg.sender_id] = msg.profiles
            }
          })

          // Enrich replied_message pointers for existing history
          const enrichedMessages = filteredMessages.map(msg => {
            if (msg.reply_to) {
              const parent = filteredMessages.find(m => m.id === msg.reply_to)
              if (parent) {
                return {
                  ...msg,
                  replied_message: {
                    id: parent.id,
                    message: parent.message,
                    sender_name: parent.profiles?.username || 'Explorer'
                  }
                }
              }
            }
            return msg
          })

          setMessages(enrichedMessages)
          setIsLoading(false)
        }
      } catch (err) {
        console.warn("Supabase messages query failed. Falling back to mock simulation.", err)
        if (active) {
          setIsFallback(true)
          setMessages(MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group'])
          setIsLoading(false)
        }
      }
    }

    fetchHistory()

    return () => { active = false }
  }, [groupId, supabase, activeUser])

  // 2. Realtime Subscriptions
  useEffect(() => {
    if (isFallback) return

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
          
          const senderProfile = await fetchProfile(newMsg.sender_id)
          const messageWithProfile: ChatMessage = {
            ...newMsg,
            profiles: senderProfile,
            reactions: []
          }
 
          setMessages((prev) => {
            // Deduplicate: check if this message id already exists and is finalized (not sending)
            const existingIndex = prev.findIndex((m) => m.id === newMsg.id)
            if (existingIndex !== -1 && !prev[existingIndex].sending) {
              return prev
            }

            // Look up parent reply details if needed
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

            // Replace the sending/optimistic copy or append
            const filtered = prev.filter((m) => m.id !== newMsg.id && !m.sending)
            return [...filtered, messageWithProfile]
          })
        }
      )
 
      // Listen to message updates
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

    let localBlobUrl: string | null = null
    if (hasFile && fileInfo && 'file' in fileInfo) {
      localBlobUrl = URL.createObjectURL(fileInfo.file)
    } else if (isSticker && fileInfo && 'stickerUrl' in fileInfo) {
      localBlobUrl = fileInfo.stickerUrl
    }

    const file_name = hasFile && fileInfo && 'file' in fileInfo ? fileInfo.file.name : null
    const file_size = hasFile && fileInfo && 'file' in fileInfo ? fileInfo.file.size : null
    const message_type = fileInfo ? fileInfo.type : 'text'

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

    setMessages((prev) => [...prev, optMessage])
    const activeReply = replyTo
    setReplyTo(null)

    // Fallback branch
    if (isFallback) {
      const finalMsg: ChatMessage = {
        ...optMessage,
        id: `msg-${Date.now()}`,
        sending: false,
        uploadProgress: undefined
      }

      try {
        const localMsgsKey = `fallback_messages_${groupId}`
        const current = JSON.parse(localStorage.getItem(localMsgsKey) || '[]')
        current.push(finalMsg)
        localStorage.setItem(localMsgsKey, JSON.stringify(current))
      } catch (err) {
        console.warn("Failed to write fallback message to localStorage:", err)
      }

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
                prev.map((m) => (m.id === tempId ? finalMsg : m))
              )
            }, 300)
          }
        }, 150)
      } else {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? finalMsg : m))
          )
        }, 500)
      }
      return
    }

    try {
      let finalFileUrl: string | null = null

      if (hasFile && fileInfo && 'file' in fileInfo) {
        const file = fileInfo.file
        const bucket = fileInfo.type === 'pdf' ? 'documents' : 'chat-media'
        
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

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, ...data, sending: false, uploadProgress: undefined } : m))
      )
    } catch (e) {
      console.error("Error sending message:", e)
      if (localBlobUrl && hasFile) {
        URL.revokeObjectURL(localBlobUrl)
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, error: true, sending: false } : m))
      )
    }
  }

  // 4. Delete Message for EVERYONE (soft-delete globally)
  const deleteMessage = async (messageId: string) => {
    if (!activeUser) return

    const targetMsg = messages.find((m) => m.id === messageId)
    if (!targetMsg || targetMsg.sender_id !== activeUser.id) return

    // Optimistic local update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, type: 'deleted', message: '' } : m
      )
    )

    if (isFallback) {
      try {
        const localMsgsKey = `fallback_messages_${groupId}`
        const current = JSON.parse(localStorage.getItem(localMsgsKey) || '[]') as ChatMessage[]
        const updated = current.map(m => m.id === messageId ? { ...m, type: 'deleted', message: '' } : m)
        localStorage.setItem(localMsgsKey, JSON.stringify(updated))
      } catch (err) {}
      return
    }

    try {
      await supabase
        .from('messages')
        .update({ type: 'deleted', message: '' })
        .eq('id', messageId)
        .eq('sender_id', activeUser.id)
    } catch (e) {
      console.error('Error deleting message globally:', e)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? targetMsg : m))
      )
    }
  }

  // 5. Delete Message for ME (hides locally only)
  const deleteMessageForMe = async (messageId: string) => {
    if (!activeUser) return

    // Filter out instantly from current viewport
    setMessages((prev) => prev.filter((m) => m.id !== messageId))

    if (isFallback) {
      try {
        const key = `deleted_msgs_${groupId}`
        const deletedIds = JSON.parse(localStorage.getItem(key) || '[]')
        if (!deletedIds.includes(messageId)) {
          deletedIds.push(messageId)
          localStorage.setItem(key, JSON.stringify(deletedIds))
        }
      } catch (err) {}
      return
    }

    try {
      await supabase
        .from('deleted_messages')
        .insert({
          user_id: activeUser.id,
          message_id: messageId
        })
    } catch (e) {
      console.error('Error deleting message for me:', e)
    }
  }

  // 6. Clear Chat for ME (clears history locally)
  const clearChatForMe = async () => {
    if (!activeUser) return

    const nowStr = new Date().toISOString()
    setMessages([])

    if (isFallback) {
      try {
        localStorage.setItem(`clear_time_${groupId}`, nowStr)
      } catch (err) {}
      return
    }

    try {
      await supabase
        .from('group_clears')
        .upsert(
          {
            user_id: activeUser.id,
            group_id: groupId,
            cleared_at: nowStr
          },
          { onConflict: 'user_id,group_id' }
        )
    } catch (e) {
      console.error('Error clearing chat:', e)
    }
  }

  // 7. Toggle Emoji Reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!activeUser) return

    const targetMsg = messages.find(m => m.id === messageId)
    if (!targetMsg) return

    const existingReaction = (targetMsg.reactions || []).find(
      r => r.user_id === activeUser.id && r.emoji === emoji
    )

    if (isFallback) {
      let updatedReactions: ChatReaction[] = []
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const current = msg.reactions || []
            if (existingReaction) {
              updatedReactions = current.filter(r => r.id !== existingReaction.id)
            } else {
              const newR: ChatReaction = {
                id: `react-${Date.now()}`,
                message_id: messageId,
                user_id: activeUser.id,
                emoji,
                created_at: new Date().toISOString(),
                profiles: activeUser
              }
              updatedReactions = [...current, newR]
            }
            return { ...msg, reactions: updatedReactions }
          }
          return msg
        })
      )

      try {
        const localMsgsKey = `fallback_messages_${groupId}`
        const currentMsgs = JSON.parse(localStorage.getItem(localMsgsKey) || '[]') as ChatMessage[]
        const updatedMsgs = currentMsgs.map(m => {
          if (m.id === messageId) {
            return { ...m, reactions: updatedReactions }
          }
          return m
        })
        localStorage.setItem(localMsgsKey, JSON.stringify(updatedMsgs))
      } catch (err) {}
      return
    }

    try {
      if (existingReaction) {
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id)
      } else {
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
    deleteMessage, // Delete for everyone
    deleteMessageForMe, // Delete for me
    clearChatForMe, // Clear chat
    replyTo,
    setReplyTo
  }
}
export default useMessages
