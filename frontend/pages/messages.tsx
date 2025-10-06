import { Card } from '../components/ui/Card'
import { useEffect, useRef, useState } from 'react'

export default function Messages() {
  const [messages, setMessages] = useState<string[]>([])
  const [text, setText] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const httpBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
    const wsBase = (httpBase.replace(/^http/, 'ws')) + '/ws'
    const ws = new WebSocket(wsBase)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data && data.type === 'message' && data.text) setMessages(m => [...m, `${data.author ? data.author + ': ' : ''}${data.text}`])
      } catch (e) {
        // ignore
      }
    }
    ws.onopen = () => setMessages(m => [...m, 'connected'])
    ws.onclose = () => setMessages(m => [...m, 'disconnected'])
    return () => ws.close()
  }, [])

  function send() {
    if (!wsRef.current || !text) return
    const payload = { type: 'message', text }
    try { wsRef.current.send(JSON.stringify(payload)) } catch (e) { console.warn(e) }
    setMessages(m => [...m, `You: ${text}`])
    setText('')
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-2">Messages</h2>
      <p className="text-sm text-gray-400 mb-2">WhatsApp-like demo chat with UNIUN bot friends.</p>
      <div className="mb-3">
        <div className="h-64 overflow-auto bg-black/20 p-2 rounded space-y-1">
          {messages.map((m, i) => <div key={i} className="text-sm text-gray-200">{m}</div>)}
        </div>
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} className="flex-1 p-2 bg-gray-800 rounded" placeholder="Type a message" />
        <button onClick={send} className="px-3 py-2 bg-gold rounded">Send</button>
      </div>
    </Card>
  )
}
