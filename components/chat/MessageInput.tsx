'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { ChatMessage } from '@/types'
import ReplyPreview from './ReplyPreview'
import UploadButton from './UploadButton'
import FilePreview from './FilePreview'

interface MessageInputProps {
  onSendMessage: (
    text: string,
    fileInfo?: { file: File; type: string } | { stickerUrl: string; type: 'sticker' }
  ) => void
  replyTo: ChatMessage | null
  onClearReply: () => void
  onTypingStatusChange: (isTyping: boolean) => void
  disabled?: boolean
  draftFile: File | null
  setDraftFile: (file: File | null) => void
}

export default function MessageInput({
  onSendMessage,
  replyTo,
  onClearReply,
  onTypingStatusChange,
  disabled,
  draftFile,
  setDraftFile,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [isTypingState, setIsTypingState] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasContent = text.trim().length > 0 || !!draftFile

  // ── Typing detection ──
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (!isTypingState) {
      setIsTypingState(true)
      onTypingStatusChange(true)
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingState(false)
      onTypingStatusChange(false)
    }, 2000)
  }

  // ── Send handler ──
  const handleSend = () => {
    if (!hasContent || disabled) return
    if (draftFile) {
      let fileType = 'document'
      if (draftFile.type.startsWith('image/')) fileType = 'image'
      else if (draftFile.type.startsWith('video/')) fileType = 'video'
      else if (draftFile.type === 'application/pdf') fileType = 'pdf'
      onSendMessage(text.trim(), { file: draftFile, type: fileType })
      setDraftFile(null)
    } else {
      onSendMessage(text.trim())
    }
    setText('')
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    setIsTypingState(false)
    onTypingStatusChange(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Auto-grow textarea ──
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [text])

  // ── Focus input on reply ──
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

  return (
    <div className="shrink-0 px-4 pb-4 pt-2 bg-[#f0ede8] dark:bg-[#090a10]">

      {/* Reply preview (above pill) */}
      <ReplyPreview message={replyTo} onClose={onClearReply} />

      {/* File preview (above pill) */}
      <FilePreview file={draftFile} onRemove={() => setDraftFile(null)} />

      {/* ── Pill container ── */}
      <div
        className={`flex items-end gap-2 bg-white dark:bg-[#0f1020] rounded-3xl transition-all duration-200 ${
          isFocused
            ? 'shadow-[0_0_0_2px_rgba(139,92,246,0.25)] dark:shadow-[0_0_0_2px_rgba(139,92,246,0.3)]'
            : 'shadow-[0_1px_6px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_6px_rgba(0,0,0,0.3)]'
        } ${replyTo || draftFile ? 'rounded-t-xl' : ''}`}
      >
        {/* Attachment button */}
        <div className="flex items-center pl-3 pb-2.5 shrink-0">
          <UploadButton
            onFileSelect={setDraftFile}
            onSendSticker={(stickerUrl) => onSendMessage('', { stickerUrl, type: 'sticker' })}
            disabled={disabled}
          />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={replyTo ? 'type your reply...' : 'say something...'}
          aria-label="Message input"
          className="flex-1 bg-transparent py-3 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none font-normal resize-none overflow-y-auto leading-relaxed max-h-[120px]"
          style={{ minHeight: '44px' }}
        />

        {/* Send button */}
        <div className="flex items-center pr-2.5 pb-2 shrink-0">
          <button
            onClick={handleSend}
            disabled={!hasContent || disabled}
            className={`flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              hasContent && !disabled
                ? 'bg-indigo-500 hover:bg-indigo-600 active:scale-90 shadow-sm text-white'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
            }`}
            title="Send message (Enter)"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" style={{ transform: 'translateX(1px)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

export type { MessageInputProps }
