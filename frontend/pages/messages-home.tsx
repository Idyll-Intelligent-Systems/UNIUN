import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmojiPicker from '../components/ui/EmojiPicker'

const USERS = [
  { id: 'PAZE', name: 'PAZE' },
  { id: 'PrDeep', name: 'PrDeep' },
  { id: 'SHAIVATE', name: 'SHAIVATE' },
  { id: 'MITRA', name: 'MITRA' },
  { id: 'MACRO', name: 'MACRO' },
  { id: 'RB', name: 'RB' },
]

export default function MessagesHome() {
  const [active, setActive] = useState<string>('PAZE')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Record<string, string[]>>({})
  const [showEmojis, setShowEmojis] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Build WS URL from current origin to avoid hardcoding localhost
  const wsBase = (typeof window !== 'undefined')
    ? ((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws')
    : ''

  useEffect(() => {
    const ws = new WebSocket(wsBase)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data && data.type === 'message' && data.text) {
          const author = data.author || 'Bot'
          const entry = `${author}: ${data.text}`
          setMessages((m: Record<string, string[]>) => ({ ...m, [active]: [...(m[active] || []), entry] }))
        }
      } catch {}
    }
    return () => ws.close()
  }, [wsBase, active])

  function send() {
    if (!wsRef.current || !text) return
    if (wsRef.current.readyState !== WebSocket.OPEN) return
    const bot = active
    const payload = { type: 'message', text, bot }
    try { wsRef.current.send(JSON.stringify(payload)) } catch {}
  setMessages((m: Record<string, string[]>) => ({ ...m, [active]: [ ...(m[active] || []), `You: ${text}` ] }))
    setText('')
  }

  const current = useMemo(() => messages[active] || [], [messages, active])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <Card className="p-3 md:col-span-1 glass shadow-premium border border-white/10">
        <h3 className="heading-premium text-lg mb-2">Chats</h3>
        <ul className="space-y-1">
          {USERS.map(u => (
            <li key={u.id}>
              <button onClick={() => setActive(u.id)} className={`w-full text-left px-3 py-2 rounded ${active===u.id ? 'bg-gray-800 text-gold' : 'hover:bg-gray-900'}`}>{u.name}</button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-3 md:col-span-2 glass shadow-premium border border-white/10">
        <h3 className="heading-premium text-lg mb-2">Chat with {active}</h3>
        <div className="h-72 overflow-auto bg-black/20 p-2 rounded-lg space-y-1 mb-2">
          {current.map((m: string, i: number) => <div key={i} className="text-sm text-gray-200">{m}</div>)}
        </div>
        <div className="flex gap-2 relative">
          <input value={text} onChange={(e:any)=>setText(e.target.value)} className="flex-1 p-3 pr-12 bg-white/10 text-premium border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder={`Message ${active}`} />
          <Button className="absolute right-28 top-1/2 -translate-y-1/2 px-2 py-1" onClick={() => setShowEmojis(s => !s)}>😊</Button>
          {showEmojis && <EmojiPicker onSelect={(e)=>{ setText(t=>t+e); setShowEmojis(false) }} onClose={()=>setShowEmojis(false)} anchorClass="right-28" />}
          <button onClick={send} className="px-4 py-2 glass shadow-premium rounded-lg border border-white/10">Send</button>
        </div>
      </Card>
    </div>
  )
}
