import { MoodPreset, AccentColorPreset, BannerPreset } from '../types/creative-room.types'

export const AVAILABLE_MOODS: MoodPreset[] = [
  { emoji: '🚀', label: 'Shipping' },
  { emoji: '🧠', label: 'Researching' },
  { emoji: '⚙️', label: 'Building' },
  { emoji: '🔥', label: 'Crunch Time' },
  { emoji: '🎨', label: 'Designing' },
  { emoji: '📚', label: 'Learning' },
  { emoji: '😴', label: 'Idle' }
]

export const ACCENT_COLORS: AccentColorPreset[] = [
  { name: 'Indigo Accent', hex: '#6366f1', bg: 'bg-[#6366f1]' },
  { name: 'Emerald Active', hex: '#10b981', bg: 'bg-[#10b981]' },
  { name: 'Rose Glow', hex: '#f43f5e', bg: 'bg-[#f43f5e]' },
  { name: 'Amber Cozy', hex: '#f59e0b', bg: 'bg-[#f59e0b]' },
  { name: 'Sky Focus', hex: '#0ea5e9', bg: 'bg-[#0ea5e9]' },
  { name: 'Violet Cyber', hex: '#8b5cf6', bg: 'bg-[#8b5cf6]' }
]

export const BANNER_PRESETS: BannerPreset[] = [
  { name: 'Cyberpunk Grid', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Cozy Workspace', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Sunset Gradient', url: 'https://images.unsplash.com/photo-1538637691880-e8f000787a71?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Stars & Zen', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80' }
]

export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js':
    case 'jsx': return 'javascript'
    case 'ts':
    case 'tsx': return 'typescript'
    case 'py': return 'python'
    case 'cpp':
    case 'cc':
    case 'h': return 'cpp'
    case 'java': return 'java'
    case 'html':
    case 'htm': return 'html'
    case 'css': return 'css'
    case 'json': return 'json'
    case 'md': return 'markdown'
    default: return 'plaintext'
  }
}

export const getFileIconColor = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js': return 'text-yellow-500'
    case 'ts': return 'text-sky-500'
    case 'py': return 'text-emerald-500'
    case 'cpp': return 'text-indigo-500'
    case 'java': return 'text-[#5E4545] dark:text-[#ffb4b4]'
    case 'html': return 'text-rose-500'
    case 'css': return 'text-teal-500'
    case 'json': return 'text-amber-400'
    case 'md': return 'text-violet-400'
    default: return 'text-gray-400'
  }
}
