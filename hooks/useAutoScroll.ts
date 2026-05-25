import { useRef, useState, useCallback } from 'react'

export function useAutoScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      const el = containerRef.current
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      })
    }
  }, [])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    // If scroll height matches client height, it's not scrollable yet
    if (el.scrollHeight <= el.clientHeight) {
      setIsNearBottom(true)
      return
    }

    // Check if user is within 150px of the bottom of the viewport
    const threshold = 150
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setIsNearBottom(distanceFromBottom <= threshold)
  }, [])

  const adjustScroll = useCallback(() => {
    if (isNearBottom) {
      scrollToBottom('smooth')
    }
  }, [isNearBottom, scrollToBottom])

  return {
    containerRef,
    scrollToBottom,
    handleScroll,
    adjustScroll,
    isNearBottom,
  }
}
export default useAutoScroll
