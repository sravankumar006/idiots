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

export default async function DashboardPage() {
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

  return <DashboardClient activeUser={profile} />
}
