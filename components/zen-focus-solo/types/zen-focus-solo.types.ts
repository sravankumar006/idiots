import { LucideIcon } from 'lucide-react'

export interface FocusCategory {
  id: string
  label: string
  icon: LucideIcon
  color: string
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface ZenFocusActiveState {
  isSessionOpen: boolean
  sessionTitle: string
  category: string
  durationMinutes: number
  customMinutes: string
  isCustomDuration: boolean
  timeLeft: number
  timerStatus: TimerStatus
  elapsedSeconds: number
  pauseCount: number
  startedAt: string | null
  lastTickTime: number
}
