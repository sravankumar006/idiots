export const formatTime = (totalSecs: number): string => {
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const calculateSeconds = (timer: { start_time: string | null; elapsed_seconds: number }): number => {
  if (!timer.start_time) return timer.elapsed_seconds
  const startMs = new Date(timer.start_time).getTime()
  const nowMs = Date.now()
  const diffSecs = Math.floor((nowMs - startMs) / 1000)
  return timer.elapsed_seconds + diffSecs
}
