'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, MessageSquare, Sparkles } from 'lucide-react'
import { signup } from '@/app/auth/actions'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BackgroundGlows } from '@/components/ui/BackgroundGlows'

// Cyber avatar presets to choose from during signup
const AVATAR_PRESETS = [
  { id: 'avatar-cyber-ghost', name: 'Cyber Ghost', gradient: 'from-cyan-400 to-blue-500', symbol: 'CG' },
  { id: 'avatar-neon-pulse', name: 'Neon Pulse', gradient: 'from-fuchsia-500 to-purple-600', symbol: 'NP' },
  { id: 'avatar-alpha-wing', name: 'Alpha Wing', gradient: 'from-emerald-400 to-teal-500', symbol: 'AW' },
  { id: 'avatar-solar-flare', name: 'Solar Flare', gradient: 'from-[#5E4545] to-[#8A6D6D] dark:from-[#ffb4b4] dark:to-[#ff8a8a]', symbol: 'SF' },
  { id: 'avatar-void-runner', name: 'Void Runner', gradient: 'from-pink-500 to-rose-600', symbol: 'VR' },
  { id: 'avatar-shadow-blade', name: 'Shadow Blade', gradient: 'from-slate-600 to-slate-800', symbol: 'SB' },
]

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].id)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password || !username) {
      setError('Please fill in all fields.')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }

    if (password.length < 6) {
      setError('Access code must be at least 6 characters.')
      return
    }

    startTransition(async () => {
      const res = await signup({
        email,
        password,
        username,
        avatar: selectedAvatar,
      })
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 select-none">
      {/* Dynamic Animated Background */}
      <BackgroundGlows />

      <div className="w-full max-w-[480px] z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-glow-purple/10 to-glow-cyan/10 border border-glow-purple/20 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <MessageSquare className="h-7 w-7 text-glow-purple" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>IDIOTS</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-glow-purple to-glow-cyan">SPACE</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium tracking-wide">
            Establish your identity within the secure matrix.
          </p>
        </div>

        {/* Card Panel */}
        <Card glowColor="purple">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-xs font-semibold leading-relaxed animate-fadeIn">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  {error}
                </span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Identified Username"
                type="text"
                placeholder="cyber_nomad"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<User className="h-4 w-4" />}
                required
                disabled={isPending}
              />

              <Input
                label="Security Email"
                type="email"
                placeholder="identity@idiots.space"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
                disabled={isPending}
              />

              <Input
                label="Access Code (Min. 6 chars)"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
                disabled={isPending}
              />

              {/* Avatar Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold tracking-wider uppercase text-gray-400 block">
                  Select Cybernetic Avatar
                </label>
                <div className="grid grid-cols-6 gap-2.5">
                  {AVATAR_PRESETS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`relative aspect-square rounded-xl bg-gradient-to-br ${
                        av.gradient
                      } flex items-center justify-center text-xs font-bold text-black border-2 transition-all duration-300 cursor-pointer ${
                        selectedAvatar === av.id
                          ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                      title={av.name}
                    >
                      {av.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" variant="neon" className="from-glow-purple/20 to-glow-cyan/20 border-glow-purple/40 hover:border-glow-cyan/60" isLoading={isPending}>
              Establish Profile
            </Button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500 font-medium">
              Already have an identity?{' '}
              <Link 
                href="/login" 
                className="text-glow-purple hover:text-glow-cyan font-semibold hover:underline transition-colors duration-200"
              >
                Authenticate Here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
