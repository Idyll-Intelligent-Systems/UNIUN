import React, { createContext, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'warning' | 'error' | 'info'
type ToastItem = { id: string; message: string; type: ToastType }

type ToastCtx = {
  show: (message: string, type?: ToastType, durationMs?: number) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const show = (message: string, type: ToastType = 'info', durationMs = 2000) => {
    const id = Math.random().toString(36).slice(2)
    setItems(prev => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id))
    }, durationMs)
  }
  const value = useMemo(() => ({ show }), [])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} />
    </ToastContext.Provider>
  )
}

function ToastViewport({ items }: { items: ToastItem[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map(it => (
        <div key={it.id} role="status" aria-live="polite" className={
          'min-w-[200px] max-w-[320px] px-3 py-2 rounded shadow text-sm ' +
          (it.type === 'success' ? 'bg-green-600 text-white' :
           it.type === 'warning' ? 'bg-yellow-600 text-black' :
           it.type === 'error' ? 'bg-red-600 text-white' :
           'bg-gray-700 text-white')
        }>
          {it.message}
        </div>
      ))}
    </div>
  )
}
