'use client'

import React from 'react'

export interface MessageActionProps {
  label: string
  icon: React.ReactNode
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
  labelClass?: string
}

export function ActionButton({
  label,
  icon,
  onClick,
  destructive,
  disabled,
  labelClass,
}: MessageActionProps) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left cursor-pointer ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : destructive
          ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:bg-rose-50/70'
          : 'text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-white active:bg-black/[0.06] dark:active:bg-white/10'
      }`}
      role="menuitem"
      aria-label={label}
    >
      <span className="shrink-0">{icon}</span>
      <span className={`text-xs font-semibold lowercase ${labelClass || ''}`}>
        {label}
      </span>
    </button>
  )
}
export default ActionButton
