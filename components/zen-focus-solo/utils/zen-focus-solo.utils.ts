import { formatTime } from '@/lib/utils/time'

export { formatTime as formatClockTime }

export const formatHoursAndMinutes = (totalSecs: number): string => {
  const totalMinutes = Math.floor(totalSecs / 60)
  if (totalMinutes === 0) return '0 minutes'
  const hrs = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins} minutes`
}
