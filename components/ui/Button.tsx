import React, { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  variant?: 'glass' | 'outline' | 'neon' | 'primary'
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
    variantStyle = "bg-transparent border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[var(--foreground)]"
  } else if (variant === 'neon' || variant === 'primary') {
    variantStyle = "bg-[var(--active-color)] text-white hover:opacity-95 border border-[var(--active-color)]/20 shadow-[0_4px_12px_rgba(138,132,123,0.15)]"
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variantStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
