import { useCallback, useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import EmojiPicker from '../components/ui/EmojiPicker'
import Button from '../components/ui/Button'
import api from '../utils/api'
import Image from 'next/image'
import { useToast } from '../components/ui/Toast'
import { normalizeMediaUrl } from '../utils/media'

export default function SearchPage() {
  const { show } = useToast()
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
  const [showEmojis, setShowEmojis] = useState(false)

  async function run() {
    try {
      const data = await api.api(`/api/search?q=${encodeURIComponent(q)}`)
      setUsers(data.users || [])
      setPosts(data.posts || [])
      show('Search loaded', 'success')
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
        show('Directory updated', 'info')
      } else if (Array.isArray(data)) {
        setAllUsers(data)
        setTotal(data.length)
      }
    } catch { setAllUsers([]); setTotal(0) }
  }, [page, sort, dir, limit, show])

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
        show('Unfollowed', 'success')
      } else {
        await api.followUser(uid)
        setFollowing(prev => [...prev, uid])
        setAllUsers(prev => prev.map(u => (u.id===uid || u._id===uid) ? { ...u, followersCount: Number(u.followersCount||0) + 1 } : u))
        show('Followed', 'success')
      }
    } catch (e: any) {
      show('Follow action failed', 'error')
    }
  }

  return (
    <Card className="p-4 glass shadow-premium border border-white/10">
      <h2 className="heading-premium text-2xl mb-4">Search</h2>
      <div className="flex gap-2 mb-4 relative">
        <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 p-3 pr-12 bg-white/10 text-premium rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder="Search users and posts" />
        <Button className="absolute right-28 top-1/2 -translate-y-1/2 px-2 py-1" onClick={() => setShowEmojis(s => !s)}>😊</Button>
        {showEmojis && <EmojiPicker onSelect={(e)=>{ setQ(t=>t+e); setShowEmojis(false) }} onClose={()=>setShowEmojis(false)} anchorClass="right-28" />}
        <button onClick={run} className="px-4 py-2 glass shadow-premium rounded-lg border border-white/10">Go</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="heading-premium text-lg mb-3">Users</h3>
          {q.trim().length === 0 ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm text-gray-400">Sort by</label>
                <select aria-label="Sort by" className="bg-white/10 text-premium rounded p-2 text-sm border border-white/20" value={sort} onChange={e => loadDirectory(1, e.target.value as any, dir, limit)}>
                  <option value="followers">Followers</option>
                  <option value="following">Following</option>
                  <option value="posts">Posts</option>
                  <option value="username">Username</option>
                </select>
                <select aria-label="Sort direction" className="bg-white/10 text-premium rounded p-2 text-sm border border-white/20" value={dir} onChange={e => loadDirectory(1, sort, e.target.value as any, limit)}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
                <label className="text-sm text-gray-400 ml-2">Page size</label>
                <select aria-label="Page size" className="bg-white/10 text-premium rounded p-2 text-sm border border-white/20" value={limit} onChange={e => loadDirectory(1, sort, dir, parseInt(e.target.value,10))}>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allUsers.length === 0 && <div className="text-gray-500">No users available</div>}
              {allUsers.map((u:any, i:number) => (
                <div key={u.id || i} className="p-3 rounded-lg bg-black/20 border border-white/10 glass">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {u.avatarUrl && <Image src={u.avatarUrl} alt={u.username} width={24} height={24} className="rounded-full" />}
                      <div className="font-medium text-gray-200">{u.username}</div>
                    </div>
                    <button onClick={()=>toggleFollow(u.id || u._id || u.username)} className="px-2 py-1 text-sm glass shadow-premium rounded border border-white/10">
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
                <button disabled={page<=1} onClick={()=>loadDirectory(page-1)} className="px-2 py-1 glass rounded border border-white/10 disabled:opacity-50">Prev</button>
                <span className="text-xs text-gray-400">Page {page}</span>
                <button disabled={page*limit>=total} onClick={()=>loadDirectory(page+1)} className="px-2 py-1 glass rounded border border-white/10 disabled:opacity-50">Next</button>
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
                      <button onClick={()=>toggleFollow(u._id || u.id || u.username)} className="px-3 py-1 glass rounded border border-white/10">
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
          <h3 className="heading-premium text-lg mb-3">Posts</h3>
          {posts.length===0 && <div className="text-gray-500">No posts</div>}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-3">
            {posts.filter((p:any)=> !!p.mediaUrl).map((p:any, i:number)=> {
              const media = normalizeMediaUrl(p.mediaUrl)
              return (
                <a key={i} href={`/posts/${encodeURIComponent(p._id || p.id || i)}`} className="block group">
                  <div className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-black/20" style={{ aspectRatio: '1 / 1' }}>
                    {media ? (
                      p.mediaType === 'video' ? (
                        <video className="absolute inset-0 w-full h-full object-cover" muted playsInline>
                          <source src={media} />
                        </video>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={media} alt={p.title || 'media'} className="absolute inset-0 w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">No media</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 text-[11px] bg-black/35 backdrop-blur-sm truncate opacity-0 group-hover:opacity-100 transition-premium">
                      {p.title}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
