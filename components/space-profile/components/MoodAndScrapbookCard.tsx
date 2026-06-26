import React from 'react'
import Link from 'next/link'
import { Heart, Award } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface MoodAndScrapbookCardProps {
  latestMood: any
  isReadOnly: boolean
  setShowMoodLog: (val: boolean) => void
  moodTrendSvg: {
    points: Array<{ x: number; y: number; label: string; value: number }>
    pathD: string
    width: number
    height: number
  } | null
  vaultItems: any[]
}

export default function MoodAndScrapbookCard({
  latestMood,
  isReadOnly,
  setShowMoodLog,
  moodTrendSvg,
  vaultItems
}: MoodAndScrapbookCardProps) {
  return (
    <div className="space-y-6">
      {/* Emotional Status & Mood Trends */}
      <Card className="p-6 relative overflow-hidden glass-panel border-none">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-400" />
          emotional status & mood trends
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3.5">
            <div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold">latest checkin</span>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xl">{latestMood?.mood_label?.split(' ')[0] || '😐'}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  "{latestMood?.status_text || 'stable state.'}"
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="neo-inset-panel border-none p-3 rounded-2xl flex-1 text-center">
                <span className="text-[9px] text-neo-secondary uppercase block font-bold">mood</span>
                <span className="text-lg font-black text-rose-400">
                  {latestMood ? (latestMood.mood_value !== undefined ? latestMood.mood_value : latestMood.mood_rating * 10) : 50}/100
                </span>
              </div>
              <div className="neo-inset-panel border-none p-3 rounded-2xl flex-1 text-center">
                <span className="text-[9px] text-neo-secondary uppercase block font-bold">energy</span>
                <span className="text-lg font-black text-amber-400">{latestMood?.energy_level || 5}/10</span>
              </div>
              <div className="neo-inset-panel border-none p-3 rounded-2xl flex-1 text-center">
                <span className="text-[9px] text-neo-secondary uppercase block font-bold">focus</span>
                <span className="text-lg font-black text-[#5E4545] dark:text-[#ffb4b4]">{latestMood?.focus_level || 5}/10</span>
              </div>
            </div>

            {!isReadOnly ? (
              <button
                onClick={() => setShowMoodLog(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-white/5 bg-white/5 text-xs font-bold text-gray-900 dark:text-white hover:bg-white/10 transition-all cursor-pointer text-center"
              >
                Log New Mood Check-in
              </button>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold bg-white/3 p-3 rounded-2xl border border-white/5 flex items-center gap-1.5 justify-center">
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                <span>sharing their coding journey with friends.</span>
              </div>
            )}
          </div>

          {/* Mood trend graph visualizer */}
          <div className="flex flex-col justify-center items-center">
            <span className="text-[9px] text-gray-500 block uppercase font-bold mb-2 tracking-wider">Mood index chart</span>
            {moodTrendSvg ? (
              <div className="relative">
                <svg width={moodTrendSvg.width} height={moodTrendSvg.height} className="overflow-visible">
                  <defs>
                    <linearGradient id="moodGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Area block */}
                  <path 
                    d={`${moodTrendSvg.pathD} L ${moodTrendSvg.points[moodTrendSvg.points.length - 1].x} ${moodTrendSvg.height - 15} L ${moodTrendSvg.points[0].x} ${moodTrendSvg.height - 15} Z`} 
                    fill="url(#moodGlow)" 
                  />
                  {/* Sparkline path */}
                  <path 
                    d={moodTrendSvg.pathD} 
                    fill="none" 
                    stroke="#f43f5e" 
                    strokeWidth="2.5" 
                    className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                  />
                  {/* Grid reference lines */}
                  <line x1="15" y1="15" x2="325" y2="15" stroke="white" strokeOpacity="0.05" strokeDasharray="3" />
                  <line x1="15" y1="75" x2="325" y2="75" stroke="white" strokeOpacity="0.05" strokeDasharray="3" />
                  
                  {/* Nodes */}
                  {moodTrendSvg.points.map((p, idx) => (
                    <g key={idx} className="group/node">
                      <circle cx={p.x} cy={p.y} r="4" fill="#141520" stroke="#f43f5e" strokeWidth="2" />
                      <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" className="opacity-70 fill-white select-none pointer-events-none">
                        {p.label.split(' ')[0]}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-500 font-semibold border border-dashed border-white/5 rounded-2xl w-full">
                need at least 2 logs to trace trend.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Pinned moments scrapbook preview */}
      <Card className="p-6 glass-panel border-none space-y-4">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="h-4 w-4 text-violet-400" />
          recent vault entries
        </h3>

        <div className="space-y-3">
          {vaultItems && vaultItems.length > 0 ? (
            vaultItems.slice(0, 3).map((item) => (
              <div key={item.id} className="neo-inset-panel border-none p-3 rounded-2xl text-xs space-y-1">
                <span className="text-[9px] text-neo-secondary font-bold block">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <p className="font-bold text-gray-900 dark:text-white lowercase">{item.title}</p>
                {item.notes && <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">"{item.notes}"</p>}
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
              no moments pinned.
            </div>
          )}
        </div>
        
        <Link 
          href="/us/vault" 
          className="block text-center py-2 border border-white/5 rounded-xl text-xs text-violet-400 font-bold hover:bg-white/3 transition-all text-decoration-none"
        >
          Open Scrapbook Vault
        </Link>
      </Card>
    </div>
  )
}
