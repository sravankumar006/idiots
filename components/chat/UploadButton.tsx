'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, Image, FileText, Smile } from 'lucide-react'

interface UploadButtonProps {
  onFileSelect: (file: File) => void
  onSendSticker: (stickerUrl: string) => void
  disabled?: boolean
}

// Pre-defined Cyberpunk SVG Stickers
const STICKERS = [
  {
    id: 'cyber-skull',
    name: 'Cyber Skull',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><path d="M25 40 C25 20, 75 20, 75 40 C75 55, 70 65, 65 70 L65 80 C65 85, 35 85, 35 80 L35 70 C30 65, 25 55, 25 40 Z" fill="#141527" stroke="#8b5cf6" stroke-width="4"/><circle cx="40" cy="45" r="7" fill="none" stroke="#f43f5e" stroke-width="3"/><circle cx="60" cy="45" r="7" fill="none" stroke="#f43f5e" stroke-width="3"/><path d="M48 55 L52 55 L50 50 Z" fill="#8b5cf6"/><line x1="45" y1="72" x2="45" y2="80" stroke="#06b6d4" stroke-width="3"/><line x1="50" y1="72" x2="50" y2="80" stroke="#06b6d4" stroke-width="3"/><line x1="55" y1="72" x2="55" y2="80" stroke="#06b6d4" stroke-width="3"/></svg>`
  },
  {
    id: 'neon-heart',
    name: 'Neon Heart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><path d="M50 82 L22 50 C12 40, 12 22, 32 22 C43 22, 48 30, 50 34 C52 30, 57 22, 68 22 C88 22, 88 40, 78 50 Z" fill="#2d1124" stroke="#f43f5e" stroke-width="4" stroke-linejoin="round"/><path d="M50 68 L32 46 C27 41, 27 30, 36 30 C43 30, 48 36, 50 39" fill="none" stroke="#d946ef" stroke-width="2"/></svg>`
  },
  {
    id: 'cyber-brain',
    name: 'Neural Net',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><path d="M50 20 C30 20, 25 35, 25 45 C25 60, 40 65, 45 75 L50 75 Z" fill="none" stroke="#06b6d4" stroke-width="4"/><path d="M50 20 C70 20, 75 35, 75 45 C75 60, 60 65, 55 75 L50 75 Z" fill="none" stroke="#8b5cf6" stroke-width="4"/><line x1="50" y1="20" x2="50" y2="75" stroke="#06b6d4" stroke-width="2" stroke-dasharray="3 3"/><path d="M30 40 C35 40, 35 30, 45 35" fill="none" stroke="#06b6d4" stroke-width="2"/><path d="M70 40 C65 40, 65 30, 55 35" fill="none" stroke="#8b5cf6" stroke-width="2"/><circle cx="50" cy="45" r="4" fill="#10b981"/></svg>`
  },
  {
    id: 'retro-rocket',
    name: 'To Space',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><path d="M50 15 C55 30, 60 40, 60 65 L40 65 C40 40, 45 30, 50 15 Z" fill="#121324" stroke="#3b82f6" stroke-width="4"/><path d="M40 65 L28 75 L34 60 Z" fill="#121324" stroke="#3b82f6" stroke-width="4"/><path d="M60 65 L72 75 L66 60 Z" fill="#121324" stroke="#3b82f6" stroke-width="4"/><circle cx="50" cy="40" r="5" fill="none" stroke="#f59e0b" stroke-width="2.5"/><path d="M44 72 L50 88 L56 72 Z" fill="#ef4444"/><path d="M47 72 L50 80 L53 72 Z" fill="#f59e0b"/></svg>`
  },
  {
    id: 'system-warning',
    name: 'Warning',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><polygon points="50,15 15,80 85,80" fill="#241914" stroke="#f59e0b" stroke-width="4" stroke-linejoin="round"/><line x1="50" y1="35" x2="50" y2="60" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="71" r="5.5" fill="#f59e0b"/></svg>`
  },
  {
    id: 'waving-robot',
    name: 'Active Node',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><rect x="30" y="30" width="40" height="35" rx="6" fill="#11241a" stroke="#10b981" stroke-width="4"/><circle cx="43" cy="42" r="3.5" fill="#10b981"/><circle cx="57" cy="42" r="3.5" fill="#10b981"/><path d="M44 52 Q50 56, 56 52" fill="none" stroke="#10b981" stroke-width="2.5"/><rect x="47" y="21" width="6" height="9" fill="#10b981"/><circle cx="50" cy="18" r="4.5" fill="#ec4899"/><path d="M19 32 L27 43" stroke="#10b981" stroke-width="4.5" stroke-linecap="round"/><path d="M81 29 Q81 44, 72 44" fill="none" stroke="#10b981" stroke-width="4.5" stroke-linecap="round"/></svg>`
  }
]

// Convert inline SVG string to Base64 Data URL for <img> tags
const getStickerDataUrl = (svgString: string) => {
  // UTF-8 base64 encoding helper for raw SVG string
  const base64 = typeof window !== 'undefined' 
    ? btoa(unescape(encodeURIComponent(svgString)))
    : ''
  return `data:image/svg+xml;base64,${base64}`
}

export default function UploadButton({
  onFileSelect,
  onSendSticker,
  disabled = false
}: UploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'files' | 'stickers'>('files')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close popup menu on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
      setIsOpen(false)
      
      // Reset input value so same file can be re-selected if removed
      e.target.value = ''
    }
  }

  const triggerFileInput = (acceptType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType
      fileInputRef.current.click()
    }
  }

  return (
    <div className="relative shrink-0 select-none" ref={containerRef}>
      
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="h-11 w-11 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/2 hover:bg-black/10 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-black/10 dark:hover:border-white/10 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        title="Share media or sticker"
      >
        <Paperclip className="h-4.5 w-4.5" />
      </button>

      {/* Hidden native input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute bottom-13 left-0 z-50 w-64 bg-white/95 dark:bg-[#0c0d1e]/90 backdrop-blur-lg rounded-2xl border border-black/10 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)] animate-fadeIn">
          
          {/* Tab Selector Headers */}
          <div className="flex border-b border-black/5 dark:border-white/5 text-[10px] font-semibold lowercase tracking-wider">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'files'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 bg-black/[0.02] dark:bg-white/2'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Image className="h-3.5 w-3.5" />
              <span>files</span>
            </button>
            <button
              onClick={() => setActiveTab('stickers')}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'stickers'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 bg-black/[0.02] dark:bg-white/2'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Smile className="h-3.5 w-3.5" />
              <span>stickers</span>
            </button>
          </div>

          {/* Tab 1: File Upload Pickers */}
          {activeTab === 'files' && (
            <div className="p-3.5 space-y-1.5">
              <button
                onClick={() => triggerFileInput('image/*,video/*')}
                className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/5 flex items-center gap-3 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <Image className="h-4 w-4 text-violet-500 dark:text-violet-400 shrink-0" />
                <span>upload image / video</span>
              </button>
              <button
                onClick={() => triggerFileInput('application/pdf')}
                className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/5 flex items-center gap-3 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4 text-violet-500 dark:text-violet-400 shrink-0" />
                <span>upload pdf document</span>
              </button>
            </div>
          )}

          {/* Tab 2: Stickers Grid */}
          {activeTab === 'stickers' && (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {STICKERS.map((sticker) => {
                  const dataUrl = getStickerDataUrl(sticker.svg)
                  return (
                    <button
                      key={sticker.id}
                      onClick={() => {
                        onSendSticker(dataUrl)
                        setIsOpen(false)
                      }}
                      className="p-1.5 rounded-xl border border-black/5 dark:border-white/5 hover:border-violet-500/30 bg-black/[0.02] dark:bg-white/2 hover:bg-violet-500/5 hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group"
                      title={sticker.name}
                    >
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img
                          src={dataUrl}
                          alt={sticker.name}
                          className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)] group-hover:drop-shadow-[0_4px_8px_rgba(139,92,246,0.2)]"
                        />
                      </div>
                      <span className="text-[8px] font-medium text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 mt-1 truncate max-w-full lowercase">
                        {sticker.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
