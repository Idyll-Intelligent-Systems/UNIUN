import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Card } from '../components/ui/Card'
import api from '../utils/api'

type Msg = { id: string; from: string; to: string; text: string; createdAt: string }

export default function MessagesDirect() {
  const [users, setUsers] = useState<any[]>([])
  const [followingOnly, setFollowingOnly] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [active, setActive] = useState<string>('')
  const [thread, setThread] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [summaries, setSummaries] = useState<any[]>([])
  const summaryTimerRef = useRef<any>(null)

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null))
    fetchUsers()
    // Try to fetch following list for better UX
    ;(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
        const meRes = await fetch(`${base}/api/users/me`, { headers: { Authorization: typeof window !== 'undefined' && localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' } as any })
        const meData = meRes.ok ? await meRes.json() : null
        const id = meData?.id || meData?._id
        if (id) {
          const res = await fetch(`${base}/api/users/${id}/following?expand=1`)
          const data = res.ok ? await res.json() : []
          setFollowingOnly(data)
        }
      } catch {}
    })()
    // load conversation summaries for last-message previews and unread badges
    const loadSummaries = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) { setSummaries([]); return }
        const res = await fetch(`${base}/api/messages`, { headers: { Authorization: `Bearer ${token}` } })
        const data = res.ok ? await res.json() : []
        setSummaries(data)
      } catch { setSummaries([]) }
      summaryTimerRef.current = setTimeout(loadSummaries, 15000)
    }
    loadSummaries()
    return () => { if (summaryTimerRef.current) { clearTimeout(summaryTimerRef.current); summaryTimerRef.current = null } }
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
      // refresh summaries and current thread
      try {
        const token2 = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (token2) {
          const base2 = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
          fetch(`${base2}/api/messages`, { headers: { Authorization: `Bearer ${token2}` } }).then(r=>r.json()).then(setSummaries).catch(()=>{})
          if (active) fetch(`${base2}/api/messages/${encodeURIComponent(active)}`, { headers: { Authorization: `Bearer ${token2}` } }).then(r=>r.json()).then(setThread).catch(()=>{})
        }
      } catch {}
      setThread(t => [...t, msg])
      setText('')
    } catch (e: any) {
      alert('Send failed: ' + e.message)
    }
  }

  const baseUsers = followingOnly.length > 0 ? followingOnly : users
  const unreadFor = (userId: string) => summaries.find((s:any)=> String(s.userId) === String(userId))?.unread || 0
  const visibleUsers = baseUsers.filter((u:any) => (u._id || u.id) !== (me?.id || me?._id))
  const lastFor = (userId: string) => summaries.find((s:any)=> String(s.userId) === String(userId))?.lastMessage as Msg | undefined

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <Card className="p-3 md:col-span-1">
        <h3 className="font-semibold mb-2">Users</h3>
        <ul className="space-y-1">
          {visibleUsers.map((u:any) => {
            const uid = u._id || u.id
            const last = lastFor(uid)
            return (
              <li key={uid}>
                <button onClick={() => loadThread(uid)} className={`w-full text-left px-3 py-2 rounded ${active===uid ? 'bg-gray-800 text-gold' : 'hover:bg-gray-900'}`}>
                  <div className="flex items-center gap-2">
                    {u.avatarUrl && <Image src={u.avatarUrl} width={24} height={24} className="rounded-full" alt={u.username} />}
                    <div className="flex-1 min-w-0">
                      {unreadFor(uid) > 0 && (
                        <span className="ml-2 text-[10px] bg-red-600 text-white rounded-full px-1.5 py-0.5">{unreadFor(uid)}</span>
                      )}
                      <div className="text-gray-200 truncate">{u.username}</div>
                      {last && <div className="text-xs text-gray-500 truncate">{last.text}</div>}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
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
