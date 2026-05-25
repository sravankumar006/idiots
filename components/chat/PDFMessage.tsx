'use client'

import React from 'react'
import { FileText, Download, ExternalLink } from 'lucide-react'

interface PDFMessageProps {
  src: string
  fileName?: string
  fileSize?: number | null
}

export default function PDFMessage({
  src,
  fileName = 'document.pdf',
  fileSize
}: PDFMessageProps) {
  
  // Convert bytes into formatted human readable size strings
  const formatSize = (bytes?: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  return (
    <div className="flex items-center gap-3.5 p-3 rounded-2xl border border-black/5 dark:border-white/5 bg-white/10 dark:bg-white/2 backdrop-blur-md max-w-[280px] sm:max-w-xs md:max-w-sm w-full select-none transition-all duration-300 hover:border-violet-500/20 hover:bg-black/5 dark:hover:bg-white/4">
      
      {/* Icon Frame */}
      <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 shadow-inner">
        <FileText className="h-5 w-5" />
      </div>

      {/* Meta Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 dark:text-white truncate" title={fileName}>
          {fileName}
        </p>
        <p className="text-[10px] text-gray-500 font-medium mt-0.5 lowercase tracking-wide">
          pdf {fileSize ? `• ${formatSize(fileSize)}` : ''}
        </p>
      </div>

      {/* Operations Panel */}
      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border border-black/5 dark:border-white/5 transition-all duration-200 cursor-pointer"
          title="Open Document"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <a
          href={src}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border border-black/5 dark:border-white/5 transition-all duration-200 cursor-pointer"
          title="Download File"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>

    </div>
  )
}
export type { PDFMessageProps }
