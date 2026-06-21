import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { UserProfile } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard Hub',
  description: 'Your growth workspace in Idiots Space.',
}

interface DashboardPageProps {
  params: Promise<Record<string, never>>
  searchParams: Promise<{ userId?: string }>
}

export default async function DashboardPage({ params, searchParams }: DashboardPageProps) {
  await params
  const resolvedSearchParams = await searchParams
  const targetUserId = resolvedSearchParams.userId || null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile: UserProfile = {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || 'Active Node',
    avatar: user.user_metadata?.avatar || 'avatar-cyber-ghost',
    created_at: user.created_at,
  }

  return <DashboardClient activeUser={profile} targetUserId={targetUserId} />
}
