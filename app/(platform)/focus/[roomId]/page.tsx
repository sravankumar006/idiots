'use client'

import React, { use } from 'react'
import { FocusRoomContainer } from '@/components/focus-room'

interface PageProps {
  params: Promise<{ roomId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function StudyCabinDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const roomId = resolvedParams.roomId

  return <FocusRoomContainer roomId={roomId} />
}
