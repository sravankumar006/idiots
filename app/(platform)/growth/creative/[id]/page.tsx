'use client'

import React, { use } from 'react'
import CreativeRoomContainer from '@/components/creative-room'

interface ParamsProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function ProjectDetailPage({ params }: ParamsProps) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  return <CreativeRoomContainer id={id} />
}
