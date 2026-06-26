import React from 'react'
import { User, Globe, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProfileIntegration } from '../types/space-profile.types'

import Github from '@/components/ui/GithubIcon'

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

interface ProfessionalPresenceCardProps {
  integration: ProfileIntegration | null
}

export default function ProfessionalPresenceCard({ integration }: ProfessionalPresenceCardProps) {
  if (!integration) return null
  if (!integration.github_username && !integration.linkedin_url && !integration.portfolio_url && !integration.resume_url) return null

  return (
    <Card className="p-6 relative overflow-hidden glass-panel border-none">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <User className="h-4 w-4 text-violet-400" />
        Professional Presence
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {integration.github_username && (
          <a
            href={`https://github.com/${integration.github_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-xs font-bold border-none"
          >
            <Github className="h-4 w-4 text-gray-900 dark:text-white" />
            <span>GitHub</span>
          </a>
        )}
        {integration.linkedin_url && (
          <a
            href={integration.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-xs font-bold border-none"
          >
            <Linkedin className="h-4 w-4 text-sky-500" />
            <span>LinkedIn</span>
          </a>
        )}
        {integration.portfolio_url && (
          <a
            href={integration.portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-xs font-bold border-none"
          >
            <Globe className="h-4 w-4 text-emerald-400" />
            <span>Portfolio</span>
          </a>
        )}
        {integration.resume_url && (
          <a
            href={integration.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-neo-bg shadow-neo text-neo-secondary hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all text-xs font-bold border-none"
          >
            <FileText className="h-4 w-4 text-rose-400" />
            <span>Resume</span>
          </a>
        )}
      </div>
    </Card>
  )
}
