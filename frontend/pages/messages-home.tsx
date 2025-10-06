import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components/ui/Card'

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
  const wsRef = useRef<WebSocket | null>(null)

  const httpBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
  const wsBase = (httpBase.replace(/^http/, 'ws')) + '/ws'

  useEffect(() => {
    const ws = new WebSocket(wsBase)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data && data.type === 'message' && data.text) {
          const author = data.author || 'Bot'
          const entry = `${author}: ${data.text}`
          setMessages((m) => ({ ...m, [active]: [...(m[active] || []), entry] }))
        }
      } catch {}
    }
    return () => ws.close()
  }, [wsBase, active])

  function send() {
    if (!wsRef.current || !text) return
    const bot = active
    const payload = { type: 'message', text, bot }
    try { wsRef.current.send(JSON.stringify(payload)) } catch {}
    setMessages((m) => ({ ...m, [active]: [ ...(m[active] || []), `You: ${text}` ] }))
    setText('')
  }

  const current = useMemo(() => messages[active] || [], [messages, active])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <Card className="p-3 md:col-span-1">
        <h3 className="font-semibold mb-2">Chats</h3>
        <ul className="space-y-1">
          {USERS.map(u => (
            <li key={u.id}>
              <button onClick={() => setActive(u.id)} className={`w-full text-left px-3 py-2 rounded ${active===u.id ? 'bg-gray-800 text-gold' : 'hover:bg-gray-900'}`}>{u.name}</button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-3 md:col-span-2">
        <h3 className="font-semibold mb-2">Chat with {active}</h3>
        <div className="h-72 overflow-auto bg-black/20 p-2 rounded space-y-1 mb-2">
          {current.map((m, i) => <div key={i} className="text-sm text-gray-200">{m}</div>)}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 p-2 bg-gray-800 rounded" placeholder={`Message ${active}`} />
          <button onClick={send} className="px-3 py-2 bg-gold rounded">Send</button>
        </div>
      </Card>
    </div>
  )
}
