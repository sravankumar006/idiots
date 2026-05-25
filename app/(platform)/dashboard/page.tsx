import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, Clock, MessageSquare, FolderHeart, ArrowRight, Activity, Brain } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Your personal hub in idiots space. Check in with the crew, track your sessions, and pick up where you left off.',
}


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const username = user?.user_metadata?.username || 'Explorer'

  return (
    <PageContainer>
      <SectionHeader 
        title="Personal Hub" 
        description="Overview of your private node and workspace activities."
      />

      {/* Welcome Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-violet-600/10 via-rose-500/5 to-transparent p-6 sm:p-8 shadow-xl">
        <div className="absolute top-[-100px] right-[-100px] h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[80px]" />
        <div className="relative z-10 space-y-4 max-w-xl">
          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Established Session
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            Welcome back, {username}!
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Your connection to Idiots Space is active. Explore your Creative Rooms, check in with the IS AI Companion, or resume your Focus Center targets.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link 
              href="/chat"
              className="glass-button text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-1.5"
            >
              <span>Open Chat Space</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link 
              href="/ai"
              className="glass-button text-xs py-2 px-4 rounded-xl font-bold bg-transparent border border-white/10 hover:bg-white/5 flex items-center gap-1.5"
            >
              <span>Consult Companion</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Focus Target</span>
            <Clock className="h-4.5 w-4.5 text-rose-400" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white">120m</h4>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Study time completed today</p>
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">IS AI</span>
            <Sparkles className="h-4.5 w-4.5 text-violet-400" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white">18</h4>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">AI interactions initiated</p>
          </div>
        </Card>

        {/* Metric 3 */}
        <Card className="p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Direct DMs</span>
            <MessageSquare className="h-4.5 w-4.5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white">4 Active</h4>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Conversations on network</p>
          </div>
        </Card>

        {/* Metric 4 */}
        <Card className="p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Workspaces</span>
            <FolderHeart className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white">3 Rooms</h4>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Creative spaces established</p>
          </div>
        </Card>
      </div>

      {/* Split section: Activity Logs & Quick launch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 cols: Recent Node Activity */}
        <Card className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-400" />
            Workspace Activity Logs
          </h3>
          <div className="space-y-3.5 pt-2">
            <div className="flex gap-3 text-xs">
              <span className="text-gray-500 font-mono">20:14</span>
              <p className="text-gray-300 font-medium">Successfully completed a <span className="text-rose-300">45-minute focus session</span></p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-gray-500 font-mono">19:42</span>
              <p className="text-gray-300 font-medium">Synchronized profile data under node alias</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-gray-500 font-mono">18:05</span>
              <p className="text-gray-300 font-medium">Linked new study repository to <span className="text-amber-300">Creative Rooms</span></p>
            </div>
          </div>
        </Card>

        {/* Right 1 col: Creative Companion stats */}
        <Card className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Brain className="h-4 w-4 text-rose-400" />
            Mind Logs Sync
          </h3>
          <div className="space-y-3 pt-2 text-xs">
            <p className="text-gray-400 leading-relaxed font-medium">
              You currently have **12 notes** saved in your Mind Logs. Sync with IS AI to generate summaries and tag index points.
            </p>
            <Link 
              href="/memories"
              className="glass-button w-full text-center py-2 rounded-xl font-bold inline-block"
            >
              Review Mind Logs
            </Link>
          </div>
        </Card>
      </div>

    </PageContainer>
  )
}
