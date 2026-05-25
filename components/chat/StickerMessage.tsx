'use client'

import React from 'react'

interface StickerMessageProps {
  src: string
  alt?: string
}

export default function StickerMessage({
  src,
  alt = 'Sticker'
}: StickerMessageProps) {
  return (
    <div className="relative inline-block max-w-[120px] sm:max-w-[150px] overflow-hidden select-none hover:scale-105 active:scale-95 transition-all duration-300">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
      />
    </div>
  )
}
export type { StickerMessageProps }
