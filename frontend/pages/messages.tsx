import Layout from '../components/Layout'
import { Card } from '../components/ui/Card'
import { useEffect, useRef, useState } from 'react'

export default function Messages() {
  const [messages, setMessages] = useState<string[]>([])
  const [text, setText] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_BASE || 'http://localhost:4000'
    const url = (base.replace(/^http/, 'ws')) + '/ws'
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data && data.type === 'message' && data.text) setMessages(m => [...m, data.text])
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
    setMessages(m => [...m, `me: ${text}`])
    setText('')
  }

  return (
    <Layout>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Messages</h2>
        <p className="text-sm text-gray-400">Chat, voice and video will be integrated here (placeholder).</p>
        <div className="mb-3">
          <div className="h-48 overflow-auto bg-black/20 p-2 rounded">
            {messages.map((m, i) => <div key={i} className="text-sm text-gray-200">{m}</div>)}
          </div>
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} className="flex-1 p-2 bg-gray-800 rounded" placeholder="Type a message" />
          <button onClick={send} className="px-3 py-2 bg-gold rounded">Send</button>
        </div>
      </Card>
    </Layout>
  )
}
