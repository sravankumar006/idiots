export type TabId = 'overview' | 'code' | 'notes' | 'references' | 'activity'

export interface ParamsProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export interface MoodPreset {
  emoji: string
  label: string
}

export interface AccentColorPreset {
  name: string
  hex: string
  bg: string
}

export interface BannerPreset {
  name: string
  url: string
}

export interface TimelineItem {
  id: string
  title: string
  description: string
  date: Date
  icon: any
}
