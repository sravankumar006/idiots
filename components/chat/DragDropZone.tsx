'use client'

import React, { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

interface DragDropZoneProps {
  onFileDrop: (file: File) => void
  children: React.ReactNode
}

/**
 * A wrapper component that intercepts HTML5 file drag-and-drop events
 * and displays a futuristic cyberpunk dropzone overlay.
 */
export default function DragDropZone({
  onFileDrop,
  children
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    
    if (dragCounterRef.current <= 0) {
      setIsDragging(false)
      dragCounterRef.current = 0
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onFileDrop(files[0])
      e.dataTransfer.clearData()
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative w-full h-full"
    >
      {/* Drop Zone Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#030307]/80 backdrop-blur-md z-50 flex items-center justify-center p-5 transition-all duration-300 animate-fadeIn">
          <div className="border-2 border-dashed border-violet-500/40 rounded-3xl w-full h-full flex flex-col items-center justify-center space-y-4 bg-violet-500/5 shadow-[inset_0_0_40px_rgba(139,92,246,0.15)]">
            
            {/* Pulsing Icon */}
            <div className="h-16 w-16 rounded-full bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 animate-bounce">
              <Upload className="h-7 w-7" />
            </div>

            {/* Soft Label Info */}
            <div className="text-center space-y-1.5 select-none lowercase">
              <p className="text-xs font-extrabold text-white tracking-wide">
                share file with your friends
              </p>
              <p className="text-[10px] text-gray-500 font-bold tracking-wider">
                release mouse to share this file in the room
              </p>
            </div>

          </div>
        </div>
      )}
      
      {children}
    </div>
  )
}
export type { DragDropZoneProps }
