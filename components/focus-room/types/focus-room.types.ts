import { Clock } from 'lucide-react'

export interface AmbientTheme {
  id: string
  name: string
  bg: string
  textColor: string
  accent: string
  description: string
}

export const AMBIENT_THEMES: AmbientTheme[] = [
  { id: 'minimal_zen', name: 'Minimal Zen', bg: 'bg-[#fdfbf7] dark:bg-[#121110]', textColor: 'text-amber-900 dark:text-amber-100', accent: 'amber', description: 'Soft amber glow and calming breathing pulse' },
  { id: 'rain', name: 'Rain', bg: 'bg-[#f1f5f9] dark:bg-[#0f172a]', textColor: 'text-slate-900 dark:text-slate-100', accent: 'sky', description: 'Deep slate grey with animated rain droplets' },
  { id: 'aurora', name: 'Aurora', bg: 'bg-gradient-to-tr from-teal-900 via-indigo-900 to-purple-950', textColor: 'text-emerald-100', accent: 'emerald', description: 'Shifting northern lights gradient' },
  { id: 'deep_space', name: 'Deep Space', bg: 'bg-[#030712]', textColor: 'text-gray-100', accent: 'indigo', description: 'Pitch dark cosmos with twinkling stars' },
  { id: 'coding_cave', name: 'Coding Cave', bg: 'bg-[#090b10]', textColor: 'text-emerald-400 font-mono', accent: 'emerald', description: 'Retro digital cave with glowing outlines' },
  { id: 'ocean_depth', name: 'Ocean Depth', bg: 'bg-gradient-to-b from-[#0f1b29] to-[#02060d]', textColor: 'text-cyan-200', accent: 'cyan', description: 'Deep aquatic blue waves' }
]

export const GOAL_OPTIONS = [
  { id: 'Study', name: 'Study', icon: Clock, color: 'text-indigo-400' },
  { id: 'Coding', name: 'Coding', icon: Clock, color: 'text-emerald-400' },
  { id: 'Research', name: 'Research', icon: Clock, color: 'text-cyan-400' },
  { id: 'Reading', name: 'Reading', icon: Clock, color: 'text-rose-400' },
  { id: 'Project Work', name: 'Project Work', icon: Clock, color: 'text-amber-400' },
]

export const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-indigo-400 to-purple-500',  symbol: 'CM' },
  'avatar-neon-pulse':   { gradient: 'from-purple-400 to-pink-500',    symbol: 'SL' },
  'avatar-alpha-wing':   { gradient: 'from-emerald-400 to-teal-500',   symbol: 'MM' },
  'avatar-solar-flare':  { gradient: 'from-[#5E4545] to-[#8A6D6D] dark:from-[#ffb4b4] dark:to-[#ff8a8a]',    symbol: 'WP' },
  'avatar-void-runner':  { gradient: 'from-rose-400 to-pink-500',      symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500',   symbol: 'MS' },
}
