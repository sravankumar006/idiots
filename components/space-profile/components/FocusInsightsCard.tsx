import React, { useMemo } from 'react'
import { Sparkles, Clock, Flame, Code, TrendingUp, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { getThemeColors } from '../types/space-profile.types'

interface FocusInsightsCardProps {
  sessions: any[]
  loading: boolean
  themeAccent: string
}

export default function FocusInsightsCard({ sessions, loading, themeAccent }: FocusInsightsCardProps) {
  const completedSessions = useMemo(() => sessions.filter(s => s.completed), [sessions])

  // Computations
  const insights = useMemo(() => {
    if (completedSessions.length === 0) {
      return {
        bestWindow: "Establish more focus sessions to discover your peak focus window.",
        bestDay: "Begin studying to determine your most productive day of the week.",
        avgDuration: 0,
        longestSession: 0,
        mostUsedCategory: "None",
        comparisonInsight: "No focus data available yet. Start your first session under Growth!",
        monthlyImprovement: "Monthly trends will appear after logging focus sessions."
      }
    }

    // 1. Avg duration & Longest session
    const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.actual_minutes || s.duration_minutes || 0), 0)
    const avgDuration = Math.round(totalMinutes / completedSessions.length)
    const longestSession = Math.max(...completedSessions.map(s => s.actual_minutes || s.duration_minutes || 0))

    // 2. Best Focus Window (Peak Hour of Day)
    const hours = Array(24).fill(0)
    completedSessions.forEach(s => {
      const date = new Date(s.started_at || s.created_at)
      const hour = date.getHours()
      hours[hour] += (s.actual_minutes || s.duration_minutes || 0)
    })
    const peakHour = hours.indexOf(Math.max(...hours))
    const formatHour = (h: number) => {
      const period = h >= 12 ? 'PM' : 'AM'
      const displayH = h % 12 === 0 ? 12 : h % 12
      return `${displayH} ${period}`
    }
    const bestWindow = `Your best focus window is ${formatHour(peakHour)} - ${formatHour((peakHour + 3) % 24)}.`

    // 3. Best Focus Day (Most productive day of week)
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const days = Array(7).fill(0)
    completedSessions.forEach(s => {
      const date = new Date(s.created_at)
      const day = date.getDay()
      days[day] += (s.actual_minutes || s.duration_minutes || 0)
    })
    const peakDayIndex = days.indexOf(Math.max(...days))
    const bestDay = `${daysOfWeek[peakDayIndex]} is your most productive day.`

    // 4. Most used category & Category comparisons
    const categoryCounts: Record<string, number> = {}
    const categoryMinutes: Record<string, number> = {}
    completedSessions.forEach(s => {
      const cat = s.category || 'Other'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      categoryMinutes[cat] = (categoryMinutes[cat] || 0) + (s.actual_minutes || s.duration_minutes || 0)
    })
    
    let mostUsedCategory = "Other"
    let maxCount = -1
    Object.keys(categoryCounts).forEach(cat => {
      if (categoryCounts[cat] > maxCount) {
        maxCount = categoryCounts[cat]
        mostUsedCategory = cat
      }
    })

    // Category comparison sentence
    let comparisonInsight = `Coding is your primary focus category.`
    const sortedCats = Object.keys(categoryMinutes).map(cat => ({
      name: cat,
      mins: categoryMinutes[cat]
    })).sort((a, b) => b.mins - a.mins)

    if (sortedCats.length >= 2) {
      const topCat = sortedCats[0]
      const secondCat = sortedCats[1]
      const diffPct = Math.round(((topCat.mins - secondCat.mins) / secondCat.mins) * 100)
      
      const formatCatLabel = (name: string) => {
        if (name === 'Project') return 'projects'
        return name.toLowerCase()
      }

      if (diffPct > 0) {
        comparisonInsight = `You focus ${diffPct}% longer on ${formatCatLabel(topCat.name)} tasks than ${formatCatLabel(secondCat.name)} tasks.`
      } else {
        comparisonInsight = `You focus most frequently on ${formatCatLabel(topCat.name)} tasks.`
      }
    } else if (sortedCats.length === 1) {
      comparisonInsight = `${sortedCats[0].name} tasks comprise 100% of your focus history.`
    }

    // 5. Monthly improvement percentage (last 30 days vs 30 days before that)
    const todayMs = new Date().setHours(0, 0, 0, 0)
    let curr30Mins = 0
    let prev30Mins = 0
    
    completedSessions.forEach(s => {
      const sTime = new Date(s.created_at).getTime()
      const diffDays = Math.floor((todayMs - sTime) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 0 && diffDays < 30) {
        curr30Mins += (s.actual_minutes || s.duration_minutes || 0)
      } else if (diffDays >= 30 && diffDays < 60) {
        prev30Mins += (s.actual_minutes || s.duration_minutes || 0)
      }
    })

    let monthlyImprovement = "Consistency is key. Focus this week to lock in your next milestone!"
    if (prev30Mins === 0) {
      if (curr30Mins > 0) {
        monthlyImprovement = "You increased your focus time by 100% this month compared to last month!"
      }
    } else {
      const diff = Math.round(((curr30Mins - prev30Mins) / prev30Mins) * 100)
      if (diff > 0) {
        monthlyImprovement = `You increased your monthly focus time by ${diff}% compared to the previous month.`
      } else if (diff < 0) {
        monthlyImprovement = `Your monthly focus time is ${Math.abs(diff)}% lower than the previous month. Let's find your rhythm again!`
      } else {
        monthlyImprovement = `You focused the exact same amount this month as the previous month. Consistency is key!`
      }
    }

    return {
      bestWindow,
      bestDay,
      avgDuration,
      longestSession,
      mostUsedCategory,
      comparisonInsight,
      monthlyImprovement
    }
  }, [completedSessions])

  if (loading) {
    return (
      <Card className="p-6 glass-panel border-none">
        <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 text-violet-500 animate-spin" />
          <span className="text-[10px] text-gray-500 font-bold lowercase">generating focus insights...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none space-y-5">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        Focus Insights
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peak Focus Window */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-neo-secondary uppercase block font-bold">peak window</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white lowercase leading-snug">{insights.bestWindow}</p>
          </div>
        </div>

        {/* Most Productive Day */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="h-5 w-5 fill-amber-500/10" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-neo-secondary uppercase block font-bold">peak day</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white lowercase leading-snug">{insights.bestDay}</p>
          </div>
        </div>

        {/* Comparative Area analysis */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Code className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-neo-secondary uppercase block font-bold">category comparison</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white lowercase leading-snug">{insights.comparisonInsight}</p>
          </div>
        </div>

        {/* Monthly growth/improvement */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-neo-secondary uppercase block font-bold">monthly progress</span>
            <p className="text-xs font-bold text-gray-900 dark:text-white lowercase leading-snug">{insights.monthlyImprovement}</p>
          </div>
        </div>
      </div>

      {/* Focus averages and records summary bar */}
      <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
        <div className="text-center">
          <span className="text-[8px] text-neo-muted font-extrabold uppercase tracking-widest block mb-0.5 font-sans">avg session</span>
          <span className="text-sm font-black text-gray-950 dark:text-white">{insights.avgDuration}m</span>
        </div>
        <div className="text-center">
          <span className="text-[8px] text-neo-muted font-extrabold uppercase tracking-widest block mb-0.5 font-sans">longest focus</span>
          <span className="text-sm font-black text-gray-950 dark:text-white">{insights.longestSession}m</span>
        </div>
        <div className="text-center">
          <span className="text-[8px] text-neo-muted font-extrabold uppercase tracking-widest block mb-0.5 font-sans">most used cat</span>
          <span className="text-sm font-black text-gray-950 dark:text-white lowercase truncate max-w-full block">
            {insights.mostUsedCategory === 'Project' ? 'projects' : insights.mostUsedCategory.toLowerCase()}
          </span>
        </div>
      </div>
    </Card>
  )
}
