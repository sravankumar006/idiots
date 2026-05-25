import React, { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  variant?: 'glass' | 'outline' | 'neon'
}

export function Button({
  children,
  isLoading,
  variant = 'glass',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle = "glass-button relative flex items-center justify-center gap-2 rounded-xl py-3 px-5 text-sm font-semibold tracking-wide transition-all duration-300 w-full disabled:opacity-50 disabled:pointer-events-none select-none"
  
  let variantStyle = ""
  if (variant === 'outline') {
    variantStyle = "bg-transparent border border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200"
  } else if (variant === 'neon') {
    variantStyle = "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border border-transparent shadow-[0_4px_12px_rgba(124,58,237,0.15)] text-white"
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variantStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
