import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import api from '../utils/api'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [following, setFollowing] = useState<string[]>([])

  async function run() {
    const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
    const res = await fetch(`${base}/api/search?q=${encodeURIComponent(q)}`)
    if (!res.ok) return
    const data = await res.json()
    setUsers(data.users || [])
    setPosts(data.posts || [])
  }

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null))
  }, [])

  async function toggleFollow(uid: string) {
    if (!me) { alert('Login required'); return }
    try {
      if (following.includes(uid)) {
        await api.unfollowUser(uid)
        setFollowing(prev => prev.filter(x => x !== uid))
      } else {
        await api.followUser(uid)
        setFollowing(prev => [...prev, uid])
      }
    } catch (e: any) {
      alert('Follow failed: ' + e.message)
    }
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-3">Search</h2>
      <div className="flex gap-2 mb-4">
        <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 p-2 bg-gray-800 rounded" placeholder="Search users and posts" />
        <button onClick={run} className="px-3 py-2 bg-gold rounded">Go</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Users</h3>
          {users.length===0 && <div className="text-gray-500">No users</div>}
          <ul className="space-y-2">
            {users.map((u:any, i:number)=> (
              <li key={i} className="flex items-center justify-between">
                <div className="text-gray-200">{u.username}</div>
                <button onClick={()=>toggleFollow(u._id || u.id || u.username)} className="px-3 py-1 bg-gold rounded text-black">
                  {following.includes(u._id || u.id || u.username) ? 'Unfollow' : 'Follow'}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Posts</h3>
          {posts.length===0 && <div className="text-gray-500">No posts</div>}
          <ul className="space-y-1">
            {posts.map((p:any, i:number)=> <li key={i} className="text-gray-200">{p.title}</li>)}
          </ul>
        </div>
      </div>
    </Card>
  )
}
