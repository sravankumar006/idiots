import React, { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-semibold tracking-wider uppercase text-[var(--secondary-text)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-gray-400 pointer-events-none select-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`glass-input w-full rounded-xl py-3 text-sm placeholder:text-gray-500 font-medium ${
              icon ? 'pl-11' : 'pl-4'
            } pr-4 ${
              error ? 'border-red-500/40 focus:border-red-500/80 focus:shadow-red-500/10' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 font-medium animate-fadeIn">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
