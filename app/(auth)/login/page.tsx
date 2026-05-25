'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Lock, MessageSquare, Sparkles } from 'lucide-react'
import { login } from '@/app/auth/actions'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BackgroundGlows } from '@/components/ui/BackgroundGlows'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    startTransition(async () => {
      const res = await login({ email, password })
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 select-none">
      {/* Dynamic Animated Background */}
      <BackgroundGlows />

      <div className="w-full max-w-[440px] z-10">
        {/* Futuristic Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-glow-blue/10 to-glow-purple/10 border border-glow-blue/20 mb-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <MessageSquare className="h-7 w-7 text-glow-blue" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>IDIOTS</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-glow-blue to-glow-purple">SPACE</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium tracking-wide">
            Access the private communication network.
          </p>
        </div>

        {/* Card Panel */}
        <Card glowColor="blue">
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
                label="Access Code"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
                disabled={isPending}
              />
            </div>

            <Button type="submit" variant="neon" isLoading={isPending}>
              Authenticate Access
            </Button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500 font-medium">
              First time on Idiots Space?{' '}
              <Link 
                href="/signup" 
                className="text-glow-blue hover:text-glow-purple font-semibold hover:underline transition-colors duration-200"
              >
                Establish Profile
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
