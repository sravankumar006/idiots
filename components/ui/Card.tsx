import React, { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glowColor?: 'blue' | 'purple' | 'cyan' | 'none'
}

export function Card({
  children,
  className = '',
  glowColor = 'none',
  ...props
}: CardProps) {
  let glowStyle = ""
  if (glowColor === 'blue') {
    glowStyle = "shadow-[0_0_40px_rgba(59,130,246,0.06)] border-glow-blue/20"
  } else if (glowColor === 'purple') {
    glowStyle = "shadow-[0_0_40px_rgba(139,92,246,0.06)] border-glow-purple/20"
  } else if (glowColor === 'cyan') {
    glowStyle = "shadow-[0_0_40px_rgba(6,182,212,0.06)] border-glow-cyan/20"
  }

  return (
    <div
      className={`glass-panel rounded-3xl p-8 sm:p-10 transition-all duration-500 hover:border-white/10 ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
