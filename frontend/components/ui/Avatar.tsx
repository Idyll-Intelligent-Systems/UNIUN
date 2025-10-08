import React, { useState } from 'react'

export default function Avatar({ src, alt = 'avatar', size = 24, className = '' }: { src?: string; alt?: string; size?: number; className?: string }) {
  const [err, setErr] = useState(false)
  const fallback = '/avatars/veee.png'
  const finalSrc = err || !src ? fallback : src
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={finalSrc}
      alt={alt}
      width={size}
      height={size}
      onError={() => setErr(true)}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
