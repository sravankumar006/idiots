'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Clock, ShieldCheck, Zap, Award } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'

export default function StudyPage() {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [preset, setPreset] = useState(25)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1)
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished
            setIsActive(false)
            if (timerRef.current) clearInterval(timerRef.current)
            alert('Focus session completed! Take a short break.')
            resetTimer()
          } else {
            setMinutes(minutes - 1)
            setSeconds(59)
          }
        }
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, minutes, seconds])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setMinutes(preset)
    setSeconds(0)
  }

  const selectPreset = (min: number) => {
    setIsActive(false)
    setPreset(min)
    setMinutes(min)
    setSeconds(0)
  }

  const formatTime = (m: number, s: number) => {
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <PageContainer>
      <SectionHeader 
        title="Focus Center" 
        description="Block out distractions and compile focused sessions inside the secure workspace."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left 2 Cols: The Timer Console */}
        <Card className="lg:col-span-2 flex flex-col items-center justify-center p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-[-150px] left-[-150px] h-[350px] w-[350px] rounded-full bg-rose-500/5 blur-[100px]" />
          
          <div className="relative z-10 text-center space-y-8 w-full max-w-sm">
            {/* Presets Row */}
            <div className="flex justify-center gap-2">
              {[25, 45, 60].map((min) => (
                <button
                  key={min}
                  onClick={() => selectPreset(min)}
                  className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    preset === min && !isActive
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-white/2 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {min} Min
                </button>
              ))}
            </div>

            {/* Glowing Timer Display */}
            <div className="py-8 relative flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-radial from-rose-500/5 to-transparent blur-2xl" />
              <span className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                {formatTime(minutes, seconds)}
              </span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-3">
                {isActive ? 'FOCUS DECK RUNNING' : 'FOCUS IN STANDBY'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={toggleTimer}
                className={`py-3.5 px-8 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg ${
                  isActive 
                    ? 'bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20' 
                    : 'bg-rose-500/20 border border-rose-500/40 text-white hover:bg-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="h-4 w-4 shrink-0" />
                    <span>Pause Flow</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 shrink-0" />
                    <span>Initiate Flow</span>
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                className="p-3.5 rounded-2xl bg-white/2 hover:bg-white/5 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* Right 1 Col: Session statistics & goals */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Focus Statistics
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Today's Focus</span>
                <span className="text-white font-bold">120 Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Weekly Target</span>
                <span className="text-gray-300 font-bold">420 / 600m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Rank Status</span>
                <span className="text-rose-300 font-bold flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" /> Core Focus node
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Focus Center Policy
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              We recommend setting phone notifications on mute and establishing a 5-minute break cycle after each 25-minute Pomodoro block to maintain optimal mental bandwidth.
            </p>
          </Card>
        </div>

      </div>
    </PageContainer>
  )
}
