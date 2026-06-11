'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage, UserProfile, ChatReaction } from '@/types'
import { uploadFile } from '@/lib/storage/uploadFile'
import { getPublicUrl } from '@/lib/storage/getFileUrl'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { deleteMessageForMe as dbDeleteForMe } from '@/lib/chat/deleteMessageForMe'
import { clearChatForMe as dbClearChat } from '@/lib/chat/clearChatForMe'

export function useMessages(groupId: string, activeUser: UserProfile | null) {
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  
  const supabase = createClient()
  
  // Delegate history, loading, fallback, and realtime sync to the specialized hook
  const {
    messages,
    setMessages,
    isLoading,
    isFallback
  } = useRealtimeMessages(groupId, activeUser)

  // 1. Send Message Action (optimistic update + upload + insert)
  const sendMessage = async (
    text: string,
    fileInfo?: { file: File; type: string } | { stickerUrl: string; type: 'sticker' },
    isAI?: boolean,
    category?: string,
    studyModeActive: boolean = false
  ) => {
    if (!groupId || !activeUser) return
    if (!text.trim() && !fileInfo) return

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
      category: category,
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

    // Fallback branch (localStorage mock simulation)
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
          category: category,
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

      // --- AI INTEGRATION: Detect @rocky and trigger shared AI ---
      if (isAI || text.toLowerCase().includes('@rocky')) {
        const aiMessageId = crypto.randomUUID()

        // ── Find context file: check current uploaded file first, then fall back to recent history
        type AttachedFile = { type: 'image' | 'pdf'; url: string; name: string } | null
        let attachedFile: AttachedFile = null

        if (finalFileUrl && (message_type === 'image' || message_type === 'pdf')) {
          attachedFile = {
            type: message_type as 'image' | 'pdf',
            url: finalFileUrl,
            name: file_name || (message_type === 'pdf' ? 'document.pdf' : 'image')
          }
        } else {
          const recentMsgs = messages.slice(-20)
          for (let i = recentMsgs.length - 1; i >= 0; i--) {
            const m = recentMsgs[i]
            if (m.file_url && m.type === 'image') {
              attachedFile = { type: 'image', url: m.file_url, name: m.file_name || 'image' }
              break
            }
            if (m.file_url && m.type === 'pdf') {
              attachedFile = { type: 'pdf', url: m.file_url, name: m.file_name || 'document.pdf' }
              break
            }
          }
        }

        // 1. Optimistic empty AI message
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          group_id: groupId,
          sender_id: '00000000-0000-0000-0000-000000000000',
          message: '',
          type: 'ai',
          category: category,
          reply_to: null,
          created_at: new Date().toISOString(),
          profiles: {
            id: '00000000-0000-0000-0000-000000000000',
            username: 'Rocky',
            email: 'rocky@idiots.local',
            avatar: 'avatar-cyber-ghost',
            created_at: new Date().toISOString()
          },
          sending: true,
          reactions: []
        }
        setMessages((prev) => [...prev, aiMessage])

        try {
          const providerPref = typeof window !== 'undefined' ? localStorage.getItem('selected_ai_provider') || 'auto' : 'auto';

          // 2. Fetch the stream from the API
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: text,
              groupId: groupId,
              aiMessageId: aiMessageId,
              category: category,
              contextMessages: messages.slice(-15).map((m) => ({
                role: m.sender_id === '00000000-0000-0000-0000-000000000000' ? 'assistant' : 'user',
                content: m.message,
              })),
              attachedFile, // pass context file info to route
              studyModeActive,
              providerPreference: providerPref,
            })
          })

          if (!response.ok) {
            try {
              const errData = await response.json()
              if (errData.message) {
                setMessages((prev) =>
                  prev.map(m => m.id === aiMessageId ? { ...m, message: errData.message, sending: false } : m)
                )
                return
              }
            } catch (_) {}
            throw new Error('AI stream failed')
          }

          if (!response.body) throw new Error('AI stream failed')

          // Read the AI mode from the response header
          const aiModeHeader = response.headers.get('X-AI-Mode') as ChatMessage['aiMode'] | null
          const resolvedAiMode: ChatMessage['aiMode'] = 
            (aiModeHeader === 'pdf-generate' || aiModeHeader === 'image-analyze' || aiModeHeader === 'pdf-analyze')
              ? aiModeHeader
              : undefined

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let accumulatedText = ''

          const aiStreamChannel = supabase.channel(`realtime-chat:${groupId}`)

          // 3. Read the stream chunk by chunk
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            accumulatedText += chunk

            // Update local state instantly
            setMessages((prev) =>
              prev.map(m => m.id === aiMessageId ? { ...m, message: accumulatedText, aiMode: resolvedAiMode } : m)
            )

            // Broadcast to others in the room
            aiStreamChannel.send({
              type: 'broadcast',
              event: 'ai_stream_update',
              payload: { messageId: aiMessageId, text: accumulatedText }
            })
          }

          // 4. Server handles persisting the message to the DB in the onFinish callback.
          // We just need to mark the message as no longer sending locally.
          if (!accumulatedText) {
            setMessages((prev) =>
              prev.map(m => m.id === aiMessageId ? { ...m, error: true, sending: false, message: '⚠️ **Rocky Quota Exhausted**\n\nRocky is currently out of tokens or has exceeded the free-tier rate limits:\n- **Minute-based limits:** Resets automatically at the start of the next minute.\n- **Daily limits:** Resets daily at 00:00 UTC.\n\nPlease wait a moment and try again.' } : m)
            )
            return
          }

          setMessages((prev) =>
            prev.map(m => m.id === aiMessageId ? { ...m, sending: false, aiMode: resolvedAiMode } : m)
          )

        } catch (err: any) {
          console.error('AI Streaming error:', err)
          setMessages((prev) =>
            prev.map(m => m.id === aiMessageId ? { ...m, error: true, sending: false, message: `⚠️ **AI Companion Error**\n\nRocky failed to process this request: \`${err?.message || 'Unexpected streaming error'}\`.\n- **Rate Limit Reset:** Minute-based limits reset in the next minute. Daily limits reset daily at 00:00 UTC.` } : m)
          )
        }
      }
      // --- END AI INTEGRATION --- ---

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

  // 2. Delete Message for EVERYONE (soft-delete globally)
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

  // 3. Delete Message for ME (hides locally only)
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

    await dbDeleteForMe(supabase, activeUser.id, messageId)
  }

  // 4. Clear Chat for ME (clears history locally)
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

    await dbClearChat(supabase, activeUser.id, groupId, nowStr)
  }

  // 5. Toggle Emoji Reaction
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
