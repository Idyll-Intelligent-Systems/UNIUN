import React, { useEffect, useMemo, useRef, useState } from 'react'

// Lightweight, dependency-free emoji picker to avoid client-side exceptions.
const EMOJIS = ['😀','😁','😂','🤣','😅','😊','😍','😘','😎','🤩','🤔','🤨','😐','😴','🤤','😷','🤒','🤕','🤢','🤮','🥳','😇','🥺','😭','😤','😡','👍','👎','👏','🙏','💪','👌','✌️','🤙','🫶','❤️','🧡','💛','💚','💙','💜','🖤','🤍','✨','🔥','🎉','✅','❌','⭐','🌟','⚡','💡','📸','🎧','🎵','🎬','🏆','⚽','🏀','🍕','🍔','🍟','🍩','🍎','🍇','🍓','🍪','☕','🍺','🍷']

export default function EmojiPicker({ onSelect, onClose, anchorClass = '' }: { onSelect: (emoji: string) => void, onClose: () => void, anchorClass?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [q, setQ] = useState('')
  const list = useMemo(() => EMOJIS.filter(e => e.includes(q.trim())), [q])

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as any)) onClose() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div ref={ref} className={`absolute ${anchorClass} mt-2 z-50 glass shadow-premium rounded-xl border border-white/10 p-3`} role="dialog" aria-label="Emoji picker">
      <input
        placeholder="Search emojis"
        value={q}
        onChange={(e)=>setQ(e.target.value)}
        className="w-full mb-2 p-2 rounded bg-white/10 border border-white/20 text-sm"
        autoFocus
      />
      <div className="grid grid-cols-8 gap-2 max-h-56 overflow-auto">
        {list.map((e, i) => (
          <button key={i} className="text-xl hover:scale-110 transition-premium" onClick={() => onSelect(e)} aria-label={`emoji ${e}`}>{e}</button>
        ))}
        {list.length === 0 && <div className="col-span-8 text-center text-xs text-gray-500 py-6">No match</div>}
      </div>
    </div>
  )
}
