'use client'

import { useEffect, useState } from 'react'

/**
 * useVisualViewport — tracks window.visualViewport height on mobile.
 * Injects a CSS custom property `--visual-viewport-height` into the document
 * root to allow developers to set dynamic layouts that resize smoothly when
 * the virtual keyboard appears.
 */
export default function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      const vv = window.visualViewport
      if (!vv) return

      const height = vv.height
      setViewportHeight(height)
      document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`)
    }

    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', handleResize)
      vv.addEventListener('scroll', handleResize)
      handleResize() // Initial run
    } else {
      // Fallback to window.innerHeight if visualViewport is not supported
      const fallbackResize = () => {
        setViewportHeight(window.innerHeight)
        document.documentElement.style.setProperty('--visual-viewport-height', `${window.innerHeight}px`)
      }
      window.addEventListener('resize', fallbackResize)
      fallbackResize()
      return () => {
        window.removeEventListener('resize', fallbackResize)
      }
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleResize)
        vv.removeEventListener('scroll', handleResize)
      }
    }
  }, [])

  return viewportHeight
}
