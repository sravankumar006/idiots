import React, { useMemo } from 'react'
import { BarChart2, Flame, GraduationCap, Code, Briefcase, BookOpen, Layers, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { getThemeColors } from '../types/space-profile.types'

const ANALYTICS_CATEGORIES = [
  { id: 'Academics', label: 'Academics', icon: GraduationCap },
  { id: 'Coding', label: 'Coding', icon: Code },
  { id: 'Project', label: 'Projects', icon: Briefcase },
  { id: 'Reading', label: 'Reading', icon: BookOpen },
  { id: 'Other', label: 'Other', icon: Layers }
]

interface FocusAnalyticsCardProps {
  sessions: any[]
  loading: boolean
  themeAccent: string
}

export default function FocusAnalyticsCard({ sessions, loading, themeAccent }: FocusAnalyticsCardProps) {
  const colors = getThemeColors(themeAccent)
  const completedSessions = useMemo(() => sessions.filter(s => s.completed), [sessions])
  
  // 1. TODAY STATS
  const todayStats = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayMs = todayStart.getTime()
    
    const todaySessions = completedSessions.filter(s => new Date(s.created_at).getTime() >= todayMs)
    const totalMinutes = todaySessions.reduce((acc, s) => acc + (s.actual_minutes || s.duration_minutes || 0), 0)
    const count = todaySessions.length
    const longest = count > 0 ? Math.max(...todaySessions.map(s => s.actual_minutes || s.duration_minutes || 0)) : 0
    
    return { totalMinutes, count, longest }
  }, [completedSessions])
  
  // 2. THIS WEEK STATS
  const weekStats = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const weekSessions = completedSessions.filter(s => new Date(s.created_at).getTime() >= oneWeekAgo)
    const totalMinutes = weekSessions.reduce((acc, s) => acc + (s.actual_minutes || s.duration_minutes || 0), 0)
    const count = weekSessions.length
    const avg = count > 0 ? Math.round(totalMinutes / count) : 0
    return {
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      avg
    }
  }, [completedSessions])
  
  // 3. STREAK
  const streak = useMemo(() => {
    if (completedSessions.length === 0) return 0
    
    const uniqueDates = Array.from(new Set(
      completedSessions.map(s => new Date(s.created_at).toDateString())
    )).map(d => new Date(d))
    
    uniqueDates.sort((a, b) => b.getTime() - a.getTime())
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const mostRecent = uniqueDates[0]
    mostRecent.setHours(0, 0, 0, 0)
    
    if (mostRecent.getTime() !== today.getTime() && mostRecent.getTime() !== yesterday.getTime()) {
      return 0
    }
    
    let currentStreak = 1
    let current = mostRecent
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const next = uniqueDates[i]
      next.setHours(0, 0, 0, 0)
      
      const diffTime = current.getTime() - next.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        currentStreak++
        current = next
      } else if (diffDays > 1) {
        break
      }
    }
    return currentStreak
  }, [completedSessions])

  // 4. CATEGORY BREAKDOWN
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {
      Academics: 0,
      Coding: 0,
      Projects: 0,
      Reading: 0,
      Other: 0
    }
    
    completedSessions.forEach(s => {
      let cat = s.category || 'Other'
      if (cat === 'Project') cat = 'Projects'
      if (counts[cat] !== undefined) {
        counts[cat]++
      } else {
        counts.Other++
      }
    })
    
    const total = completedSessions.length
    return Object.keys(counts).map(key => ({
      name: key,
      count: counts[key],
      percentage: total > 0 ? Math.round((counts[key] / total) * 100) : 0
    })).sort((a, b) => b.count - a.count)
  }, [completedSessions])

  // 5. 90-DAY HEATMAP CELLS
  const heatmapData = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const cells = []
    const minutesByDateStr: Record<string, number> = {}
    
    completedSessions.forEach(s => {
      const dateStr = new Date(s.created_at).toDateString()
      minutesByDateStr[dateStr] = (minutesByDateStr[dateStr] || 0) + (s.actual_minutes || s.duration_minutes || 0)
    })
    
    for (let i = 89; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      const dateStr = d.toDateString()
      const mins = minutesByDateStr[dateStr] || 0
      
      let level = 0
      if (mins > 0 && mins < 25) level = 1
      else if (mins >= 25 && mins < 50) level = 2
      else if (mins >= 50 && mins < 90) level = 3
      else if (mins >= 90) level = 4
      
      cells.push({ date: d, mins, level })
    }
    
    return cells
  }, [completedSessions])

  // 6. WEEKLY CHART DATA
  const weeklyChartData = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const minutesByDateStr: Record<string, number> = {}
    completedSessions.forEach(s => {
      const dateStr = new Date(s.created_at).toDateString()
      minutesByDateStr[dateStr] = (minutesByDateStr[dateStr] || 0) + (s.actual_minutes || s.duration_minutes || 0)
    })
    
    const list = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      const dateStr = d.toDateString()
      const mins = minutesByDateStr[dateStr] || 0
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      list.push({ dayLabel, mins })
    }
    
    const maxMins = Math.max(...list.map(item => item.mins), 60)
    return { list, maxMins }
  }, [completedSessions])

  // 7. MONTHLY CHART DATA (4 WEEKS)
  const monthlyChartData = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayMs = todayStart.getTime()
    
    const weekMins = [0, 0, 0, 0]
    
    completedSessions.forEach(s => {
      const sTime = new Date(s.created_at).getTime()
      const diffDays = Math.floor((todayMs - sTime) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 0 && diffDays < 7) {
        weekMins[0] += (s.actual_minutes || s.duration_minutes || 0)
      } else if (diffDays >= 7 && diffDays < 14) {
        weekMins[1] += (s.actual_minutes || s.duration_minutes || 0)
      } else if (diffDays >= 14 && diffDays < 21) {
        weekMins[2] += (s.actual_minutes || s.duration_minutes || 0)
      } else if (diffDays >= 21 && diffDays < 28) {
        weekMins[3] += (s.actual_minutes || s.duration_minutes || 0)
      }
    })
    
    const list = [
      { label: '3 wks ago', hours: Number((weekMins[3] / 60).toFixed(1)) },
      { label: '2 wks ago', hours: Number((weekMins[2] / 60).toFixed(1)) },
      { label: 'last wk', hours: Number((weekMins[1] / 60).toFixed(1)) },
      { label: 'this wk', hours: Number((weekMins[0] / 60).toFixed(1)) }
    ]
    
    const maxHours = Math.max(...list.map(item => item.hours), 10)
    return { list, maxHours }
  }, [completedSessions])

  if (loading) {
    return (
      <Card className="p-6 glass-panel border-none">
        <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 text-violet-500 animate-spin" />
          <span className="text-[10px] text-gray-500 font-bold lowercase">compiling focus analytics...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none space-y-6">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-violet-400" />
        Focus Analytics
      </h3>

      {/* Grid: Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl space-y-2">
          <span className="text-[9px] text-neo-secondary uppercase block font-bold">today</span>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">focus time:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{todayStats.totalMinutes}m</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">sessions:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{todayStats.count}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">longest:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{todayStats.longest}m</span>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl space-y-2">
          <span className="text-[9px] text-neo-secondary uppercase block font-bold">this week</span>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">total hours:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{weekStats.totalHours}h</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">avg duration:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{weekStats.avg}m</span>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="neo-inset-panel border-none p-4 rounded-2xl flex flex-col justify-center items-center text-center">
          <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-1">
            <Flame className="h-4.5 w-4.5 fill-rose-500 animate-bounce" />
          </div>
          <span className="text-[9px] text-neo-secondary uppercase block font-bold">focus streak</span>
          <span className="text-xl font-black text-rose-400">{streak} {streak === 1 ? 'day' : 'days'}</span>
        </div>
      </div>

      {/* Grid: Charts & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Category Breakdown */}
        <div className="space-y-4">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">category distribution</span>
          <div className="space-y-3">
            {categoryStats.map((item) => {
              const catConfig = ANALYTICS_CATEGORIES.find(c => c.id === item.name) || ANALYTICS_CATEGORIES[4]
              const CatIcon = catConfig.icon
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                    <div className="flex items-center gap-1.5">
                      <CatIcon className="h-3.5 w-3.5 text-gray-500" />
                      <span>{catConfig.label}</span>
                    </div>
                    <span>{item.percentage}% ({item.count})</span>
                  </div>
                  <div className="w-full bg-white/5 dark:bg-black/20 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${colors.bg}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Charts: Trends */}
        <div className="space-y-4">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">focus trends</span>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Weekly trend bar chart */}
            <div className="neo-inset-panel border-none p-3.5 rounded-2xl flex flex-col justify-between min-h-[170px]">
              <span className="text-[8.5px] text-neo-secondary uppercase block font-bold text-center mb-2">weekly trend (mins)</span>
              <div className="flex items-end justify-between h-24 px-1">
                {weeklyChartData.list.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group/bar relative">
                    <div className="absolute bottom-full mb-1 bg-black/90 text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold z-10">
                      {item.mins}m
                    </div>
                    <div 
                      className={`w-2.5 rounded-t-sm bg-gradient-to-t ${colors.gradient} transition-all duration-500`}
                      style={{ height: `${Math.max(4, (item.mins / weeklyChartData.maxMins) * 100)}%` }}
                    />
                    <span className="text-[8px] text-gray-500 font-bold mt-1.5 scale-90">{item.dayLabel.slice(0, 1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly trend bar chart */}
            <div className="neo-inset-panel border-none p-3.5 rounded-2xl flex flex-col justify-between min-h-[170px]">
              <span className="text-[8.5px] text-neo-secondary uppercase block font-bold text-center mb-2">monthly trend (hours)</span>
              <div className="flex items-end justify-between h-24 px-1">
                {monthlyChartData.list.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group/bar relative">
                    <div className="absolute bottom-full mb-1 bg-black/90 text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold z-10">
                      {item.hours}h
                    </div>
                    <div 
                      className={`w-3.5 rounded-t-sm bg-gradient-to-t ${colors.gradient} transition-all duration-500`}
                      style={{ height: `${Math.max(4, (item.hours / monthlyChartData.maxHours) * 100)}%` }}
                    />
                    <span className="text-[8px] text-gray-500 font-bold mt-1.5 scale-90 truncate max-w-[32px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub-style Heatmap */}
      <div className="space-y-3 pt-2">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">focus activity (last 90 days)</span>
        <div className="neo-inset-panel border-none p-4 rounded-2xl">
          <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5 md:gap-2">
            {heatmapData.map((cell, idx) => {
              const bgClass = cell.level === 0 ? colors.levels[0] : colors.levels[cell.level]
              return (
                <div 
                   key={idx} 
                   className={`aspect-square w-full rounded-md transition-all duration-300 relative group/cell border border-transparent hover:scale-110 cursor-pointer ${bgClass}`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-40 bg-black/90 text-[8.5px] text-white px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover/cell:opacity-100 transition-opacity whitespace-nowrap font-bold shadow-lg">
                    {cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {cell.mins} mins
                  </div>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex justify-end items-center gap-1.5 mt-3 text-[8.5px] text-gray-500 font-bold uppercase tracking-wider">
            <span>Less</span>
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[0]}`} />
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[1]}`} />
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[2]}`} />
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[3]}`} />
            <div className={`w-2.5 h-2.5 rounded-sm ${colors.levels[4]}`} />
            <span>More</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
