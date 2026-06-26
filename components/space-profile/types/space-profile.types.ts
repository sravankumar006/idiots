export interface WallpaperConfig {
  id: string
  name: string
  css: string
}

export const WALLPAPERS: WallpaperConfig[] = [
  { id: 'starry-night', name: 'starry night 🌌', css: '' },
  { id: 'cozy-study', name: 'warm study room 🕯️', css: '' },
  { id: 'rainy-window', name: 'rainy window 🌧️', css: '' },
  { id: 'forest-cabin', name: 'forest cabin 🌲', css: '' },
  { id: 'sunset-vibe', name: 'neon sunset 🌇', css: '' },
]

export interface ThemeColorsConfig {
  label: string
  glow: string
  text: string
  bg: string
  button: string
}

export const THEMES: Record<string, ThemeColorsConfig> = {
  violet: { label: 'violet dream', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)] border-violet-500/20', text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', button: 'bg-violet-600 hover:bg-violet-500' },
  emerald: { label: 'forest zen', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)] border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', button: 'bg-emerald-600 hover:bg-emerald-500' },
  rose: { label: 'warm rose', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)] border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', button: 'bg-rose-600 hover:bg-rose-500' },
  amber: { label: 'cozy amber', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)] border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', button: 'bg-amber-600 hover:bg-amber-500' },
  sky: { label: 'cloud sky', glow: 'shadow-[0_0_15px_rgba(14,165,233,0.2)] border-sky-500/20', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', button: 'bg-sky-600 hover:bg-sky-500' },
}

export interface ProfileIntegration {
  user_id: string
  github_username: string
  linkedin_url: string
  portfolio_url: string
  resume_url: string
  bio: string
  current_mission: string
  current_mission_progress: number
}

export const getThemeColors = (theme: string) => {
  switch (theme) {
    case 'emerald':
      return {
        primary: 'text-emerald-400',
        bg: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-teal-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-emerald-500/20', 'bg-emerald-500/40', 'bg-emerald-500/60', 'bg-emerald-550 bg-emerald-500']
      }
    case 'rose':
      return {
        primary: 'text-rose-400',
        bg: 'bg-rose-500',
        gradient: 'from-rose-500 to-pink-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-rose-500/20', 'bg-rose-500/40', 'bg-rose-500/60', 'bg-rose-500']
      }
    case 'amber':
      return {
        primary: 'text-amber-400',
        bg: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-amber-500/20', 'bg-amber-500/40', 'bg-amber-500/60', 'bg-amber-500']
      }
    case 'sky':
      return {
        primary: 'text-sky-400',
        bg: 'bg-sky-500',
        gradient: 'from-sky-500 to-blue-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-sky-500/20', 'bg-sky-500/40', 'bg-sky-500/60', 'bg-sky-500']
      }
    case 'violet':
    default:
      return {
        primary: 'text-violet-400',
        bg: 'bg-violet-600 dark:bg-violet-500',
        gradient: 'from-violet-500 to-indigo-400',
        levels: ['bg-white/5 dark:bg-white/[0.02] border border-white/5', 'bg-violet-500/20', 'bg-violet-500/40', 'bg-violet-500/60', 'bg-violet-500']
      }
  }
}

