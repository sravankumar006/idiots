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
    fileInfo?: { file: File; type: string } | { stickerUrl: string; type: 'sticker' },
    category?: string
  ) => void
  replyTo: ChatMessage | null
  onClearReply: () => void
  onTypingStatusChange: (isTyping: boolean) => void
  disabled?: boolean
  draftFile: File | null
  setDraftFile: (file: File | null) => void
  studyModeActive?: boolean
}

export default function MessageInput({
  onSendMessage,
  replyTo,
  onClearReply,
  onTypingStatusChange,
  disabled,
  draftFile,
  setDraftFile,
  studyModeActive = false,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
    const cat = selectedCategory || undefined
    if (draftFile) {
      let fileType = 'document'
      if (draftFile.type.startsWith('image/')) fileType = 'image'
      else if (draftFile.type.startsWith('video/')) fileType = 'video'
      else if (draftFile.type === 'application/pdf') fileType = 'pdf'
      onSendMessage(text.trim(), { file: draftFile, type: fileType }, cat)
      setDraftFile(null)
    } else {
      onSendMessage(text.trim(), undefined, cat)
    }
    setText('')
    setSelectedCategory(null)
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
    <div className="shrink-0 px-3 pb-3 md:px-8 md:pb-6 pt-2 bg-transparent">

      {/* Category selector row (above pill, visible if studyModeActive is true) */}
      {studyModeActive && (
        <div className="flex flex-wrap gap-1.5 mb-2 px-1 select-none animate-fadeIn">
          {[
            { id: 'Question', label: 'question', emoji: '❓' },
            { id: 'Resource', label: 'resource', emoji: '📚' },
            { id: 'Study Update', label: 'study update', emoji: '🕯️' },
            { id: 'Coding Update', label: 'coding update', emoji: '💻' },
            { id: 'Project Discussion', label: 'project discussion', emoji: '🤝' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-wide transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/5'
                    : 'bg-white/40 dark:bg-[#16181d]/40 border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/8'
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="lowercase">{cat.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Reply preview (above pill) */}
      <ReplyPreview message={replyTo} onClose={onClearReply} />

      {/* File preview (above pill) */}
      <FilePreview file={draftFile} onRemove={() => setDraftFile(null)} />

      {/* ── Pill container ── */}
      <div
        className={`flex items-end gap-2 bg-white dark:bg-[#16181d] border border-black/[0.03] dark:border-white/[0.04] rounded-[28px] transition-all duration-300 ease-out relative z-10 ${
          isFocused
            ? 'shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] -translate-y-0.5'
            : 'shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] hover:shadow-[0_6px_24px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_6px_24px_rgb(0,0,0,0.25)]'
        } ${replyTo || draftFile ? 'rounded-t-2xl' : ''}`}
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
