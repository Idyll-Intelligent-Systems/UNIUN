import { Card } from '../components/ui/Card'
import EmojiPicker from '../components/ui/EmojiPicker'
import Button from '../components/ui/Button'
import { useEffect, useRef, useState } from 'react'
import { buildWsUrl } from '../utils/ws'

export default function MessagesV2() {
  const [messages, setMessages] = useState<string[]>([])
  const [text, setText] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
  const url = buildWsUrl('/ws')
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
  if (data && data.type === 'message' && data.text) setMessages((m: string[]) => [...m, data.text])
      } catch (e) {
        // ignore
      }
    }
  ws.onopen = () => setMessages((m: string[]) => [...m, 'connected'])
  ws.onclose = () => setMessages((m: string[]) => [...m, 'disconnected'])
    return () => ws.close()
  }, [])

  function send() {
    if (!wsRef.current || !text) return
    if (wsRef.current.readyState !== WebSocket.OPEN) return
    const payload = { type: 'message', text }
    try { wsRef.current.send(JSON.stringify(payload)) } catch (e) { console.warn(e) }
  setMessages((m: string[]) => [...m, `me: ${text}`])
    setText('')
  }

  const [showEmojis, setShowEmojis] = useState(false)
  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Messages (v2)</h2>
      <div className="mb-3">
        <div className="h-48 overflow-auto bg-black/20 p-2 rounded">
          {messages.map((m: string, i: number) => <div key={i} className="text-sm text-gray-200">{m}</div>)}
        </div>
      </div>
      <div className="flex gap-2 relative">
        <input value={text} onChange={(e: any) => setText(e.target.value)} className="flex-1 p-3 pr-12 bg-white/10 text-premium border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder="Type a message" />
        <Button className="absolute right-28 top-1/2 -translate-y-1/2 px-2 py-1" onClick={() => setShowEmojis(s => !s)}>😊</Button>
        {showEmojis && <EmojiPicker onSelect={(e)=>{ setText(t=>t+e); setShowEmojis(false) }} onClose={()=>setShowEmojis(false)} anchorClass="right-28" />}
        <button onClick={send} className="px-4 py-2 glass shadow-premium rounded-lg border border-white/10">Send</button>
      </div>
    </Card>
  )
}
