import { useState } from 'react'
import { Card } from '../components/ui/Card'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])

  async function run() {
    const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
    const res = await fetch(`${base}/api/search?q=${encodeURIComponent(q)}`)
    if (!res.ok) return
    const data = await res.json()
    setUsers(data.users || [])
    setPosts(data.posts || [])
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
          <ul className="space-y-1">
            {users.map((u:any, i:number)=> <li key={i} className="text-gray-200">{u.username}</li>)}
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
