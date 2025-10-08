import React from 'react'

export default function Button({ children, className = '', ...props }: any) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl glass shadow-premium transition-premium hover:scale-[1.04] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
