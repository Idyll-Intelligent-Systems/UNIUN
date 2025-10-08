import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Avatar from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import EmojiPicker from '../components/ui/EmojiPicker'
import Button from '../components/ui/Button'
import api from '../utils/api'

type Msg = { id: string; from: string; to: string; text: string; createdAt: string }

export default function MessagesDirect() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [followingOnly, setFollowingOnly] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [active, setActive] = useState<string>('')
  const [thread, setThread] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [summaries, setSummaries] = useState<any[]>([])
  const summaryTimerRef = useRef<any>(null)

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null))
    fetchUsers()
    // Try to fetch following list for better UX
    ;(async () => {
      try {
        const meRes = await fetch(`/api/users/me`, { headers: { Authorization: typeof window !== 'undefined' && localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' } as any })
        const meData = meRes.ok ? await meRes.json() : null
        const id = meData?.id || meData?._id
        if (id) {
          const res = await fetch(`/api/users/${id}/following?expand=1`)
          const data = res.ok ? await res.json() : []
          setFollowingOnly(data)
        }
      } catch {}
    })()
    // load conversation summaries for last-message previews and unread badges
    const loadSummaries = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) { setSummaries([]); return }
        const res = await fetch(`/api/messages`, { headers: { Authorization: `Bearer ${token}` } })
        const data = res.ok ? await res.json() : []
        setSummaries(data)
      } catch { setSummaries([]) }
      summaryTimerRef.current = setTimeout(loadSummaries, 15000)
    }
    loadSummaries()
    return () => { if (summaryTimerRef.current) { clearTimeout(summaryTimerRef.current); summaryTimerRef.current = null } }
  }, [])

  // If URL contains ?with=<userId>, auto-open that thread once users load
  useEffect(() => {
    const withId = (router.query.with as string) || ''
    if (!withId) return
    // ensure we have a token to fetch thread; try after a short delay if needed
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return
    loadThread(withId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.with])

  async function fetchUsers() {
    try {
      const res = await fetch(`/api/users`)
      const data = await res.json()
      setUsers(data)
    } catch { setUsers([]) }
  }

  async function loadThread(withUserId: string) {
    setActive(withUserId)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/messages/${encodeURIComponent(withUserId)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error('load failed')
      const data = await res.json()
      setThread(data)
    } catch { setThread([]) }
  }

  async function send() {
    if (!active || !text.trim()) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/messages/${encodeURIComponent(active)}`, {
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
          fetch(`/api/messages`, { headers: { Authorization: `Bearer ${token2}` } }).then(r=>r.json()).then(setSummaries).catch(()=>{})
          if (active) fetch(`/api/messages/${encodeURIComponent(active)}`, { headers: { Authorization: `Bearer ${token2}` } }).then(r=>r.json()).then(setThread).catch(()=>{})
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
      <Card className="p-0 md:col-span-1 overflow-hidden">
        <div className="p-3 border-b border-white/10"><h3 className="font-semibold">Chats</h3></div>
        <ul className="max-h-[70vh] overflow-auto">
          {visibleUsers.map((u:any) => {
            const uid = u._id || u.id
            const last = lastFor(uid)
            return (
              <li key={uid}>
                <button onClick={() => loadThread(uid)} className={`w-full text-left px-3 py-2 transition-premium ${active===uid ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <Avatar src={u.avatarUrl} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-200 truncate font-medium">{u.username}</div>
                        {unreadFor(uid) > 0 && (
                          <span className="ml-2 text-[10px] bg-red-600 text-white rounded-full px-1.5 py-0.5">{unreadFor(uid)}</span>
                        )}
                      </div>
                      {last && <div className="text-xs text-gray-400 truncate">{last.text}</div>}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
      <Card className="p-0 md:col-span-2 overflow-hidden">
        <div className="p-3 border-b border-white/10">
          <h3 className="font-semibold">{users.find(u=> (u._id||u.id)===active)?.username || 'Select a chat'}</h3>
        </div>
        <div className="h-[60vh] md:h-[70vh] overflow-auto p-3 space-y-2 bg-black/10">
          {thread.length === 0 && <div className="text-gray-500">No messages yet.</div>}
          {thread.map((m) => {
            const mine = m.from === (me?.id || me?._id)
            return (
              <div key={m.id} className={`max-w-[78%] sm:max-w-[60%] rounded-2xl px-3 py-2 ${mine ? 'ml-auto bg-[#1f7a3b] text-white' : 'bg-white/10 text-gray-200'}`}>
                <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
                <div className={`text-[10px] mt-1 ${mine ? 'text-emerald-100/80' : 'text-gray-400'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            )
          })}
        </div>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 relative">
            <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 p-3 pr-12 bg-white/10 text-premium border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder="Message" />
            <Button className="absolute right-28 top-1/2 -translate-y-1/2 px-2 py-1 rounded-full" onClick={() => setShowEmojis(s => !s)}>😊</Button>
            {showEmojis && <EmojiPicker onSelect={(e)=>{ setText(t=>t+e); setShowEmojis(false) }} onClose={()=>setShowEmojis(false)} anchorClass="right-28" />}
            <button onClick={send} className="px-4 py-2 glass shadow-premium rounded-full border border-white/10">Send</button>
          </div>
        </div>
      </Card>
    </div>
  )
}
