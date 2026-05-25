'use client'

import React, { useEffect, useRef, useCallback } from 'react'

const EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '✨']

interface ReactionPickerProps {
  /** Position in viewport coordinates */
  x: number
  y: number
  onReact: (emoji: string) => void
  onClose: () => void
}

/**
 * ReactionPicker — desktop floating emoji reaction popup.
 * Opens at (x, y) cursor position after right-click.
 * Keyboard-navigable: Arrow keys cycle through emojis, Enter selects, Escape closes.
 */
export default function ReactionPicker({ x, y, onReact, onClose }: ReactionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const focusIndexRef = useRef(0)

  // Auto-focus first emoji on mount
  useEffect(() => {
    const btns = containerRef.current?.querySelectorAll<HTMLButtonElement>('[data-emoji-btn]')
    btns?.[0]?.focus()
  }, [])

  // Smart positioning — ensure popup stays within viewport
  const POPUP_W = 280
  const POPUP_H = 60
  const vpW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vpH = typeof window !== 'undefined' ? window.innerHeight : 800

  const left = Math.min(x, vpW - POPUP_W - 16)
  const top = y + POPUP_H > vpH ? y - POPUP_H - 8 : y + 8

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const btns = containerRef.current?.querySelectorAll<HTMLButtonElement>('[data-emoji-btn]')
    if (!btns) return

    if (e.key === 'ArrowRight') {
      focusIndexRef.current = (focusIndexRef.current + 1) % btns.length
      btns[focusIndexRef.current].focus()
      e.preventDefault()
    } else if (e.key === 'ArrowLeft') {
      focusIndexRef.current = (focusIndexRef.current - 1 + btns.length) % btns.length
      btns[focusIndexRef.current].focus()
      e.preventDefault()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid immediate close from the triggering right-click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  // Close on Escape globally
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="React to message"
      onKeyDown={handleKeyDown}
      className="fixed z-50 animate-scaleIn"
      style={{ left, top }}
    >
      <div className="flex items-center gap-1 bg-white dark:bg-[#1a1b2e] rounded-2xl border border-black/8 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-2">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            data-emoji-btn
            onClick={() => {
              onReact(emoji)
              onClose()
            }}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-xl hover:bg-black/[0.05] dark:hover:bg-white/10 hover:scale-125 focus:scale-125 focus:bg-black/5 dark:focus:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
            aria-label={`React with ${emoji}`}
            tabIndex={0}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export type { ReactionPickerProps }
