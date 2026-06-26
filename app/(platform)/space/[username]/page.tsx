'use client'

import React, { use } from 'react'
import { SpaceProfileContainer } from '@/components/space-profile'

interface SpacePageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function SpacePage({ params }: SpacePageProps) {
  const resolvedParams = use(params)
  const username = decodeURIComponent(resolvedParams.username)

  return <SpaceProfileContainer username={username} />
}
