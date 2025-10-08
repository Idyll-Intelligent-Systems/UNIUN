import React from 'react'

export const Card = React.forwardRef<HTMLDivElement, { children: React.ReactNode, className?: string }>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`glass shadow-premium transition-premium rounded-xl overflow-hidden border border-white/10 ${className}`}>
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export default Card
