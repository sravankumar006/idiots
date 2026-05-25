'use client'

import { useRef, useState, useCallback } from 'react'

interface UseSwipeGestureOptions {
  /** Minimum horizontal distance (px) before a swipe is registered */
  threshold?: number
  /** Maximum vertical drift (px) allowed before gesture is cancelled */
  verticalLimit?: number
  /** Callback fired when swipe-right exceeds threshold */
  onSwipeRight?: () => void
  /** Whether the gesture is currently enabled */
  enabled?: boolean
}

interface SwipeGestureResult {
  /** Bind these to the element that should detect swipes */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
  }
  /** Current horizontal offset in px (for animating the bubble) */
  swipeOffset: number
  /** Whether a swipe is actively in progress */
  isSwiping: boolean
}

/**
 * useSwipeGesture — detects right-swipe gestures on touch devices.
 * Designed for swipe-to-reply: tracks touch position, returns swipeOffset
 * for CSS transform, and fires onSwipeRight when threshold exceeded.
 */
export function useSwipeGesture({
  threshold = 60,
  verticalLimit = 40,
  onSwipeRight,
  enabled = true,
}: UseSwipeGestureOptions = {}): SwipeGestureResult {
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const triggered = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    triggered.current = false
    setIsSwiping(false)
    setSwipeOffset(0)
  }, [enabled])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartX.current
    const dy = touch.clientY - touchStartY.current

    // Only allow right-swipes, not left. Cancel if too much vertical drift.
    if (dx <= 0 || Math.abs(dy) > verticalLimit) {
      if (isSwiping) {
        setSwipeOffset(0)
        setIsSwiping(false)
      }
      return
    }

    // Only activate if horizontal motion is dominant (dx > 2 * |dy|)
    if (Math.abs(dx) < 2 * Math.abs(dy)) return

    setIsSwiping(true)

    // Clamp offset to threshold + rubber-band effect
    const clamped = dx > threshold
      ? threshold + (dx - threshold) * 0.2
      : dx
    setSwipeOffset(Math.min(clamped, threshold * 1.3))

    // Fire callback once at threshold
    if (dx >= threshold && !triggered.current) {
      triggered.current = true
      // Haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10)
      }
      onSwipeRight?.()
    }
  }, [enabled, threshold, verticalLimit, isSwiping, onSwipeRight])

  const onTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (!enabled) return
    // Animate back to 0
    setSwipeOffset(0)
    setIsSwiping(false)
    triggered.current = false
  }, [enabled])

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    swipeOffset,
    isSwiping,
  }
}

export default useSwipeGesture
