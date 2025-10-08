import React, { useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import data from '@emoji-mart/data'

// Load the Picker from emoji-mart dynamically to avoid SSR issues. Some builds export {Picker}, some default.
const Picker: any = dynamic(async () => {
  const mod: any = await import('emoji-mart')
  return mod.Picker || mod.default
}, { ssr: false })

export default function EmojiPicker({ onSelect, onClose, anchorClass = '' }: { onSelect: (emoji: string) => void, onClose: () => void, anchorClass?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as any)) onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const locale = useMemo(() => ({
    search: 'Search emojis',
    categories: {
      frequent: 'Recent',
      people: 'Smileys & People',
      nature: 'Animals & Nature',
      foods: 'Food & Drink',
      activity: 'Activity',
      places: 'Travel & Places',
      objects: 'Objects',
      symbols: 'Symbols',
      flags: 'Flags',
    },
  }), [])

  // WhatsApp-like dropdown: search, categories, recent, skin tones
  return (
    <div
      ref={ref}
      className={`absolute ${anchorClass} mt-2 z-50 glass shadow-premium rounded-xl border border-white/10 p-2 before:content-[''] before:absolute before:-top-2 before:right-6 before:border-8 before:border-transparent before:border-b-white/10 before:drop-shadow`}
      role="dialog"
      aria-label="Emoji picker"
    >
      <div className="w-[340px] max-w-[92vw]">
        {/* emoji-mart Picker (dynamically imported to avoid SSR warnings) */}
        <Picker
          data={data}
          onEmojiSelect={(e: any) => onSelect(e?.native || e?.shortcodes || '')}
          previewPosition="none"
          skinTonePosition="preview"
          navPosition="bottom"
          searchPosition="sticky"
          emojiButtonRadius="12px"
          emojiSize={24}
          perLine={9}
          categories={['frequent', 'people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags']}
          dynamicWidth={true}
          theme="dark"
          locale={locale as any}
          autoFocus={true}
          noCountryFlags={false}
        />
      </div>
    </div>
  )
}
