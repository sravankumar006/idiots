'use client'

import React from 'react'

interface VideoMessageProps {
  src: string
  fileName?: string
}

export default function VideoMessage({
  src,
  fileName = 'Video attachment'
}: VideoMessageProps) {
  return (
    <div className="relative rounded-2xl border border-black/5 dark:border-white/5 bg-white/10 dark:bg-white/2 p-1.5 backdrop-blur-md overflow-hidden max-w-[280px] sm:max-w-xs md:max-w-sm w-full select-none transition-all duration-300 hover:border-violet-500/20">
      <video
        src={src}
        controls
        preload="metadata"
        className="w-full h-auto rounded-xl max-h-[240px] bg-black/80 object-contain shadow-inner"
      />
      {fileName && (
        <div className="px-2.5 pt-2 pb-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
          {fileName}
        </div>
      )}
    </div>
  )
}
export type { VideoMessageProps }
