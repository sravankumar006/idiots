'use client'

import React, { useState } from 'react'
import NextImage from 'next/image'
import { Eye, Download, Loader2 } from 'lucide-react'

interface ImageMessageProps {
  src: string
  fileName?: string
  isSending?: boolean
}

export default function ImageMessage({
  src,
  fileName = 'Image attachment',
  isSending = false
}: ImageMessageProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Determine if this is a Supabase URL eligible for Next.js optimization.
  // For data URLs or blob URLs, fall back to a regular img tag.
  const isOptimizable = src.startsWith('http://') || src.startsWith('https://')

  return (
    <div className="relative group max-w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/5 bg-white/10 dark:bg-white/2 backdrop-blur-md transition-all duration-300 hover:border-violet-500/20 hover:shadow-lg inline-block select-none">
      
      {/* Loader indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-[#0a0b15]/60 backdrop-blur-sm z-10 min-h-[150px] min-w-[200px]">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
        </div>
      )}
      
      {isOptimizable ? (
        // Next.js optimized image — automatic WebP/AVIF, lazy loading, blur placeholder
        <NextImage
          src={src}
          alt={fileName}
          width={480}
          height={360}
          onLoad={() => setIsLoading(false)}
          quality={85}
          loading="lazy"
          className="max-h-[260px] md:max-h-[360px] w-auto max-w-full object-contain rounded-xl transition-all duration-500 hover:scale-[1.01]"
          style={{
            width: 'auto',
            height: 'auto',
            maxHeight: '360px',
            minWidth: isLoading ? '200px' : 'auto',
            minHeight: isLoading ? '150px' : 'auto',
          }}
        />
      ) : (
        // Fallback for blob/data URLs
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={fileName}
          onLoad={() => setIsLoading(false)}
          className="max-h-[260px] md:max-h-[360px] w-auto max-w-full object-contain rounded-xl transition-all duration-500 hover:scale-[1.01]"
          style={{ minWidth: isLoading ? '200px' : 'auto', minHeight: isLoading ? '150px' : 'auto' }}
        />
      )}

      {/* Action Overlay */}
      {!isLoading && !isSending && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all duration-200 hover:scale-110 cursor-pointer"
            title="View full image"
            aria-label="Open image in new tab"
          >
            <Eye className="h-4 w-4" />
          </a>
          <a
            href={src}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all duration-200 hover:scale-110 cursor-pointer"
            title="Download image"
            aria-label="Download image"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}
