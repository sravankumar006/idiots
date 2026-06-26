import React from 'react'
import { Laptop } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface ThemeConfigurationPanelProps {
  selectedTheme: string
  setSelectedTheme: (theme: string) => void
}

export default function ThemeConfigurationPanel({
  selectedTheme,
  setSelectedTheme
}: ThemeConfigurationPanelProps) {
  return (
    <Card className="space-y-4">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <Laptop className="h-4 w-4 text-violet-400" />
        Theme Configuration
      </h3>
      
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[
          { id: 'deep-space', name: 'Deep Space', bg: 'bg-[#020205]' },
          { id: 'midnight-violet', name: 'Violet Aura', bg: 'bg-violet-950/20 border-violet-500/30' },
          { id: 'cyber-cyan', name: 'Cyber Cyan', bg: 'bg-cyan-950/20 border-cyan-500/30' },
        ].map((theme) => (
          <button
            type="button"
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              selectedTheme === theme.id
                ? 'border-violet-400 bg-violet-500/10 text-white shadow-[0_0_10px_rgba(139,92,246,0.15)]'
                : 'border-white/5 bg-white/2 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className={`h-4 w-4 rounded-full ${theme.bg} border border-white/10`} />
            <span>{theme.name}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}
