'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import {
  Clock,
  X,
  ChevronDown,
  Check,
  Code,
  Briefcase,
  BookOpen,
  Layers,
  GraduationCap
} from 'lucide-react'
import { useZenFocusSolo } from '../hooks/useZenFocusSolo'
import LobbyScreen from './LobbyScreen'
import SoloTimerDisc from './SoloTimerDisc'
import ControlDeck from './ControlDeck'
import { formatHoursAndMinutes } from '../utils/zen-focus-solo.utils'

const CATEGORIES = [
  { id: 'Academics', label: 'Academics', icon: GraduationCap, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'Coding', label: 'Coding', icon: Code, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'Project', label: 'Project', icon: Briefcase, color: 'text-cyan-500 bg-cyan-500/10' },
  { id: 'Reading', label: 'Reading', icon: BookOpen, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'Other', label: 'Other', icon: Layers, color: 'text-gray-500 bg-gray-500/10' }
]

export default function ZenFocusSoloContainer() {
  const {
    activeProfile,
    isLoadingProfile,
    isSessionOpen,
    setIsSessionOpen,
    sessionTitle,
    setSessionTitle,
    category,
    setCategory,
    isCategoryDropdownOpen,
    setIsCategoryDropdownOpen,
    durationMinutes,
    setDurationMinutes,
    customMinutes,
    setCustomMinutes,
    isCustomDuration,
    setIsCustomDuration,
    timeLeft,
    timerStatus,
    totalSessionSeconds,
    todayFocusTime,
    sessionsCompleted,
    dropdownRef,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    handleEndSessionEarly,
    resetToSetup
  } = useZenFocusSolo()

  const activeCategory = CATEGORIES.find(c => c.id === category) || CATEGORIES[1]
  const ActiveCategoryIcon = activeCategory.icon

  // Click outside categories listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownRef, setIsCategoryDropdownOpen])

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-500 lowercase">establishing secure growth node...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0e14] text-gray-200 font-sans flex flex-col items-center relative overflow-hidden px-4 py-8 select-none">
      
      {/* Background glow node elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 dark:bg-violet-900/5 rounded-full blur-3xl pointer-events-none animate-breathing" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 dark:bg-cyan-900/5 rounded-full blur-3xl pointer-events-none animate-breathing" style={{ animationDelay: '3s' }} />

      {/* Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between z-20 mb-8 pt-safe">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-violet-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neo-secondary">
            zen focus solo deck
          </span>
        </div>
        <Link href="/dashboard" className="touch-target h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200">
          <X className="h-5 w-5" />
        </Link>
      </div>

      {!isSessionOpen ? (
        <LobbyScreen onOpenSession={() => setIsSessionOpen(true)} />
      ) : (
        <div className="w-full max-w-md flex-1 flex flex-col justify-between z-10 animate-pageFadeIn">
          {/* Top Section: Inputs */}
          <div className="space-y-4">
            {/* Session Title Input */}
            <div className="w-full">
              <input
                type="text"
                disabled={timerStatus !== 'idle'}
                placeholder="What are you focusing on?"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="glass-input w-full rounded-2xl py-3.5 px-4 text-xs font-semibold placeholder:text-gray-500 disabled:opacity-50 text-white focus:outline-none"
              />
            </div>

            {/* Category Dropdown Selection */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                disabled={timerStatus !== 'idle'}
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-left text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-between disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeCategory.color}`}>
                    <ActiveCategoryIcon className="h-3.5 w-3.5" />
                  </div>
                  <span>{activeCategory.label}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#181922] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-30 animate-fadeIn">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon
                    const isSelected = category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id)
                          setIsCategoryDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-xs font-semibold flex items-center justify-between hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${cat.color}`}>
                            <CatIcon className="h-3.5 w-3.5" />
                          </div>
                          <span>{cat.label}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-violet-500" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Center Section: Timer */}
          <SoloTimerDisc
            timeLeft={timeLeft}
            timerStatus={timerStatus}
            totalSessionSeconds={totalSessionSeconds}
            durationMinutes={durationMinutes}
            customMinutes={customMinutes}
            isCustomDuration={isCustomDuration}
            setDurationMinutes={setDurationMinutes}
            setCustomMinutes={setCustomMinutes}
            setIsCustomDuration={setIsCustomDuration}
          />

          {/* Controls Bar */}
          <ControlDeck
            timerStatus={timerStatus}
            timeLeft={timeLeft}
            startFocusSession={startFocusSession}
            pauseFocusSession={pauseFocusSession}
            resumeFocusSession={resumeFocusSession}
            handleEndSessionEarly={handleEndSessionEarly}
            resetToSetup={resetToSetup}
          />

          {/* Bottom Section: Stats */}
          <div className="grid grid-cols-2 gap-3.5 z-10 pt-4 border-t border-white/5 w-full">
            <div className="bg-neo-bg shadow-neo-inset-shallow p-4 rounded-2xl text-center flex flex-col justify-center">
              <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-widest block mb-1">
                Today&apos;s Focus
              </span>
              <span className="text-sm font-bold text-white">
                {formatHoursAndMinutes(todayFocusTime)}
              </span>
            </div>
            <div className="bg-neo-bg shadow-neo-inset-shallow p-4 rounded-2xl text-center flex flex-col justify-center">
              <span className="text-[9px] text-neo-muted font-extrabold uppercase tracking-widest block mb-1">
                Completed Today
              </span>
              <span className="text-sm font-bold text-white">
                {sessionsCompleted} {sessionsCompleted === 1 ? 'session' : 'sessions'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
