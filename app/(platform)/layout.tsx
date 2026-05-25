import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlatformLayout from '@/components/layout/PlatformLayout'
import { UserProfile } from '@/types'

export default async function PlatformGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verify auth session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if unauthenticated
  if (!user) {
    redirect('/login')
  }

  // Parse UserProfile metadata
  const profile: UserProfile = {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || 'Active Node',
    avatar: user.user_metadata?.avatar || 'avatar-cyber-ghost',
    created_at: user.created_at,
  }

  return (
    <PlatformLayout profile={profile}>
      {children}
    </PlatformLayout>
  )
}
