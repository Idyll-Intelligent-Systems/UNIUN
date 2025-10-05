import React from 'react'

export default function Button({ children, className = '', ...props }: any) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-br from-[#0f1724] to-[#0b0b0f] text-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
