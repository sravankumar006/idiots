import React, { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glowColor?: 'bronze' | 'moss' | 'neutral' | 'none' | 'blue' | 'purple' | 'cyan'
}

export function Card({
  children,
  className = '',
  glowColor = 'none',
  ...props
}: CardProps) {
  let glowStyle = ""
  if (glowColor === 'bronze' || glowColor === 'purple') {
    glowStyle = "shadow-[0_0_40px_rgba(154,132,98,0.1)] border-[var(--accent-warm)]/10"
  } else if (glowColor === 'moss' || glowColor === 'cyan' || glowColor === 'blue') {
    glowStyle = "shadow-[0_0_40px_rgba(94,122,90,0.1)] border-[var(--accent-cool)]/10"
  } else if (glowColor === 'neutral') {
    glowStyle = "shadow-[0_0_40px_rgba(138,132,123,0.08)] border-[var(--active-color)]/10"
  }

  return (
    <div
      className={`bg-neo-bg shadow-neo rounded-[28px] p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-neo-high ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
