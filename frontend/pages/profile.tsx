import { Card } from '../components/ui/Card'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { listPosts, getCart, listBookmarks, listReposts, listReplies, me as getMe, followUser, unfollowUser } from '../utils/api'
import ContentCard from '../components/ContentCard'

export default function Profile() {
  const [tab, setTab] = useState<'posts'|'reposts'|'replies'|'cart'|'bookmarks'|'followers'|'following'|'account'>('posts')
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [cart, setCart] = useState<{ items: { itemId: string; price: number }[] } | null>(null)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [reposts, setReposts] = useState<any[]>([])
  const [replies, setReplies] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])

  useEffect(() => {
    const loadPosts = () =>
      listPosts()
        .then((items: any[]) =>
          setAllPosts((items || []).map((p: any) => ({
            id: p.id || p._id || (p._id && p._id.toString()),
            _id: p._id || p.id,
            title: p.title,
            mediaType: p.mediaType || 'image',
            mediaUrl: p.mediaUrl || null,
            likes: p.likes || 0,
            replies: p.replies || 0,
            reposts: p.reposts || 0,
            views: p.views || 0,
            ownerId: p.ownerId,
            price: typeof p.price === 'number' ? p.price : undefined,
          })))
        )
        .catch(() => setAllPosts([]))

    loadPosts()
  getCart().then(setCart).catch(() => setCart({ items: [] }))
    listBookmarks().then(setBookmarks).catch(() => setBookmarks([]))
    listReposts().then(setReposts).catch(() => setReposts([]))
    listReplies().then(setReplies).catch(() => setReplies([]))
  getMe().then(setMe).catch(()=>setMe(null))

    const onDel = (e: any) => {
      const id = e?.detail?.id
      if (!id) return
      setAllPosts((ps) => ps.filter((p) => (p._id || p.id) !== id))
    }
    if (typeof window !== 'undefined') window.addEventListener('post:deleted', onDel)
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('post:deleted', onDel)
    }
  }, [])

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'reposts', label: 'Reposts' },
    { key: 'replies', label: 'Replies' },
    { key: 'cart', label: 'Cart' },
    { key: 'bookmarks', label: 'Bookmarks' },
    { key: 'followers', label: 'Followers' },
    { key: 'following', label: 'Following' },
    { key: 'account', label: 'Account' },
  ]

  useEffect(() => {
    if (!me?.id && !me?._id) return
    const id = me.id || me._id
    // ask backend to expand follower/following into profiles
    fetch(`${(process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002')}/api/users/${id}/followers?expand=1`).then(r=>r.json()).then(setFollowers).catch(()=>setFollowers([]))
    fetch(`${(process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002')}/api/users/${id}/following?expand=1`).then(r=>r.json()).then(setFollowing).catch(()=>setFollowing([]))
  }, [me])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Profile</h2>
        {me && (
          <div className="text-xs text-gray-400">Logged in as: <span className="text-gray-200">{me.username}</span> <span className="ml-2 opacity-70">({me.id || me._id})</span></div>
        )}
      </div>
      <p className="text-gray-400 mb-4">Bio, stats, media</p>

      <div className="flex gap-3 border-b border-gray-800 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 ${tab===t.key ? 'text-gold border-b-2 border-gold' : 'text-gray-400'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {allPosts.length === 0 && (
            <div className="text-gray-400 flex items-center justify-between bg-black/30 p-3 rounded">
              <div>
                <div className="font-medium">No posts yet</div>
                <div className="text-sm text-gray-500">Use Upload to add your first post.</div>
              </div>
              <a href="/upload" className="px-3 py-2 bg-gold text-black rounded">Upload</a>
            </div>
          )}
          {allPosts.map((p: any) => <ContentCard key={p._id || p.id} item={p} />)}
        </div>
      )}

      {tab === 'reposts' && (
        <div className="space-y-2 text-gray-300">
          {(reposts.length === 0) && <div className="text-gray-500">No reposts yet.</div>}
          {reposts.length > 0 && (
            <div className="space-y-4">
              {allPosts.filter(p => reposts.some((r:any)=> (r.postId=== (p._id || p.id || (p._id && p._id.toString()))))).map((p: any) => (
                <ContentCard key={p._id || p.id} item={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'replies' && (
        <div className="space-y-4 text-gray-300">
          {(replies.length === 0) && <div className="text-gray-500">No replies yet.</div>}
          {replies.length > 0 && (
            <div className="space-y-4">
              {replies.map((r:any, i:number) => {
                const p = allPosts.find(p => (p._id || p.id || (p._id && p._id.toString())) === r.postId)
                return (
                  <div key={i} className="space-y-2">
                    {p && <ContentCard item={p} />}
                    <div className="px-2 text-sm text-gray-400">Your reply: {r.text}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'cart' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">Items in your cart</div>
          <div className="space-y-4">
            {(cart?.items || []).map((it, i) => {
              const p = allPosts.find(p => (p._id || p.id || (p._id && p._id.toString())) === String(it.itemId))
              return p ? (
                <ContentCard key={i} item={p} />
              ) : (
                <div key={i} className="text-gray-200">Item {it.itemId} — ${'{'}it.price{'}'}</div>
              )
            })}
          </div>
          {(cart?.items?.length ?? 0) === 0 && <div className="text-gray-500">Cart is empty.</div>}
        </div>
      )}

      {tab === 'bookmarks' && (
        <div className="space-y-2 text-gray-300">
          {(bookmarks.length === 0) && <div className="text-gray-500">No bookmarks yet.</div>}
          {bookmarks.length > 0 && (
            <div className="space-y-4">
              {allPosts.filter(p => bookmarks.some((b:any)=> (b.postId=== (p._id || p.id || (p._id && p._id.toString()))))).map((p: any) => (
                <ContentCard key={p._id || p.id} item={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'followers' && (
        <div className="space-y-2 text-gray-300">
          {followers.length===0 && <div className="text-gray-500">No followers yet.</div>}
          <ul className="space-y-2">
            {followers.map((u:any, i:number)=> (
              <li key={u.id || i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {u.avatarUrl && <Image src={u.avatarUrl} alt={u.username} width={24} height={24} className="rounded-full" />}
                  <span className="text-gray-200">{u.username}</span>
                </div>
                <button onClick={()=>followUser(u.id || u._id)} className="px-2 py-1 text-sm bg-gold rounded text-black">Follow back</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'following' && (
        <div className="space-y-2 text-gray-300">
          {following.length===0 && <div className="text-gray-500">Not following anyone yet.</div>}
          <ul className="space-y-2">
            {following.map((u:any, i:number)=> (
              <li key={u.id || i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {u.avatarUrl && <Image src={u.avatarUrl} alt={u.username} width={24} height={24} className="rounded-full" />}
                  <span className="text-gray-200">{u.username}</span>
                </div>
                <button onClick={()=>unfollowUser(u.id || u._id)} className="px-2 py-1 text-sm bg-gray-700 rounded">Unfollow</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-3 text-gray-300">
          <div className="text-sm">Use this to sign out and switch accounts.</div>
          <button
            onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('token'); window.location.href = '/' } }}
            className="px-3 py-2 bg-red-600 rounded text-white w-fit"
          >Logout</button>
        </div>
      )}
    </Card>
  )
}
