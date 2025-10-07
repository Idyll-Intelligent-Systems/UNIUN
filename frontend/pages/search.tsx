import { useCallback, useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import api from '../utils/api'
import Image from 'next/image'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [following, setFollowing] = useState<string[]>([])
  const [sort, setSort] = useState<'followers'|'following'|'posts'|'username'>('followers')
  const [dir, setDir] = useState<'asc'|'desc'>('desc')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(12)

  async function run() {
    try {
      const data = await api.api(`/api/search?q=${encodeURIComponent(q)}`)
      setUsers(data.users || [])
      setPosts(data.posts || [])
    } catch { setUsers([]); setPosts([]) }
  }

  const loadDirectory = useCallback(async (nextPage = page, nextSort = sort, nextDir = dir, nextLimit = limit) => {
    try {
      const data = await api.api(`/api/users/cards?sort=${encodeURIComponent(nextSort)}&dir=${encodeURIComponent(nextDir)}&page=${encodeURIComponent(String(nextPage))}&limit=${encodeURIComponent(String(nextLimit))}`)
      if (Array.isArray(data?.items)) {
        setAllUsers(data.items)
        setTotal(Number(data.total || 0))
        setPage(nextPage)
        setSort(nextSort)
        setDir(nextDir)
        setLimit(nextLimit)
      } else if (Array.isArray(data)) {
        setAllUsers(data)
        setTotal(data.length)
      }
    } catch { setAllUsers([]); setTotal(0) }
  }, [page, sort, dir, limit])

  useEffect(() => {
    api.me().then(async (m) => {
      setMe(m)
      try {
        const id = m?.id || m?._id
        if (id) {
          const list:any[] = await api.listFollowing(id)
          setFollowing(list.map(u => u.id || u._id).filter(Boolean))
        }
      } catch {}
    }).catch(() => setMe(null))
    // Load user cards for default view
    ;(async () => { await loadDirectory() })()
  }, [loadDirectory])

  async function toggleFollow(uid: string) {
    if (!me) { alert('Login required'); return }
    try {
      if (following.includes(uid)) {
        await api.unfollowUser(uid)
        setFollowing(prev => prev.filter(x => x !== uid))
        // optimistic counts update on directory
        setAllUsers(prev => prev.map(u => (u.id===uid || u._id===uid) ? { ...u, followersCount: Math.max(0, Number(u.followersCount||0) - 1) } : u))
      } else {
        await api.followUser(uid)
        setFollowing(prev => [...prev, uid])
        setAllUsers(prev => prev.map(u => (u.id===uid || u._id===uid) ? { ...u, followersCount: Number(u.followersCount||0) + 1 } : u))
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
          {q.trim().length === 0 ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm text-gray-400">Sort by</label>
                <select aria-label="Sort by" className="bg-gray-800 rounded p-1 text-sm" value={sort} onChange={e => loadDirectory(1, e.target.value as any, dir, limit)}>
                  <option value="followers">Followers</option>
                  <option value="following">Following</option>
                  <option value="posts">Posts</option>
                  <option value="username">Username</option>
                </select>
                <select aria-label="Sort direction" className="bg-gray-800 rounded p-1 text-sm" value={dir} onChange={e => loadDirectory(1, sort, e.target.value as any, limit)}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
                <label className="text-sm text-gray-400 ml-2">Page size</label>
                <select aria-label="Page size" className="bg-gray-800 rounded p-1 text-sm" value={limit} onChange={e => loadDirectory(1, sort, dir, parseInt(e.target.value,10))}>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allUsers.length === 0 && <div className="text-gray-500">No users available</div>}
              {allUsers.map((u:any, i:number) => (
                <div key={u.id || i} className="p-3 rounded bg-black/30 border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {u.avatarUrl && <Image src={u.avatarUrl} alt={u.username} width={24} height={24} className="rounded-full" />}
                      <div className="font-medium text-gray-200">{u.username}</div>
                    </div>
                    <button onClick={()=>toggleFollow(u.id || u._id || u.username)} className="px-2 py-1 text-sm bg-gold rounded text-black">
                      {following.includes(u.id || u._id || u.username) ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
                  {u.bio && <div className="text-xs text-gray-400 mb-2">{u.bio}</div>}
                  <div className="text-xs text-gray-400 flex gap-3">
                    <span>Followers: <span className="text-gray-200">{u.followersCount ?? 0}</span></span>
                    <span>Following: <span className="text-gray-200">{u.followingCount ?? 0}</span></span>
                    <span>Posts: <span className="text-gray-200">{u.postsCount ?? 0}</span></span>
                  </div>
                  <div className="mt-2">
                    <a className="text-xs text-gold hover:underline" href={`/users/${encodeURIComponent(u.id || u._id || u.username)}`}>View profile</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-gray-500">Total: {total}</div>
              <div className="flex items-center gap-2">
                <button disabled={page<=1} onClick={()=>loadDirectory(page-1)} className="px-2 py-1 bg-gray-800 rounded disabled:opacity-50">Prev</button>
                <span className="text-xs text-gray-400">Page {page}</span>
                <button disabled={page*limit>=total} onClick={()=>loadDirectory(page+1)} className="px-2 py-1 bg-gray-800 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
            </>
          ) : (
            <>
              {users.length===0 ? (
                <div className="text-gray-500">No users</div>
              ) : (
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
              )}
            </>
          )}
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
