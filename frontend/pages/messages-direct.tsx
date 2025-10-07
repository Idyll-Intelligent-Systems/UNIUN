import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import api from '../utils/api'

type Msg = { id: string; from: string; to: string; text: string; createdAt: string }

export default function MessagesDirect() {
  const [users, setUsers] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [active, setActive] = useState<string>('')
  const [thread, setThread] = useState<Msg[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null))
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
      const res = await fetch(`${base}/api/users`)
      const data = await res.json()
      setUsers(data)
    } catch { setUsers([]) }
  }

  async function loadThread(withUserId: string) {
    setActive(withUserId)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`${base}/api/messages/${encodeURIComponent(withUserId)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error('load failed')
      const data = await res.json()
      setThread(data)
    } catch { setThread([]) }
  }

  async function send() {
    if (!active || !text.trim()) return
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`${base}/api/messages/${encodeURIComponent(active)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text })
      })
      if (!res.ok) throw new Error('send failed')
      const msg = await res.json()
      setThread(t => [...t, msg])
      setText('')
    } catch (e: any) {
      alert('Send failed: ' + e.message)
    }
  }

  const visibleUsers = users.filter(u => (u._id || u.id) !== (me?.id || me?._id))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <Card className="p-3 md:col-span-1">
        <h3 className="font-semibold mb-2">Users</h3>
        <ul className="space-y-1">
          {visibleUsers.map((u:any) => (
            <li key={u._id || u.id}>
              <button onClick={() => loadThread(u._id || u.id)} className={`w-full text-left px-3 py-2 rounded ${active===(u._id||u.id) ? 'bg-gray-800 text-gold' : 'hover:bg-gray-900'}`}>{u.username}</button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-3 md:col-span-2">
        <h3 className="font-semibold mb-2">Direct with {users.find(u=> (u._id||u.id)===active)?.username || '—'}</h3>
        <div className="h-72 overflow-auto bg-black/20 p-2 rounded space-y-1 mb-2">
          {thread.length === 0 && <div className="text-gray-500">No messages yet.</div>}
          {thread.map((m) => (
            <div key={m.id} className={`text-sm ${m.from === (me?.id || me?._id) ? 'text-gold' : 'text-gray-200'}`}>
              {(m.from === (me?.id || me?._id)) ? 'You' : 'Them'}: {m.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 p-2 bg-gray-800 rounded" placeholder="Type a message" />
          <button onClick={send} className="px-3 py-2 bg-gold rounded">Send</button>
        </div>
      </Card>
    </div>
  )
}
