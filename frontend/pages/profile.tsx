import { Card } from '../components/ui/Card'
import { useEffect, useState } from 'react'
import { listPosts, getCart, listBookmarks, listReposts, listReplies } from '../utils/api'
import ContentCard from '../components/ContentCard'

export default function Profile() {
  const [tab, setTab] = useState<'posts'|'reposts'|'replies'|'cart'|'bookmarks'>('posts')
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [cart, setCart] = useState<{ items: { itemId: string; price: number }[] } | null>(null)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [reposts, setReposts] = useState<any[]>([])
  const [replies, setReplies] = useState<any[]>([])

  useEffect(() => {
    listPosts().then(setAllPosts).catch(() => setAllPosts([]))
    getCart().then(setCart).catch(() => setCart({ items: [] }))
    listBookmarks().then(setBookmarks).catch(() => setBookmarks([]))
    listReposts().then(setReposts).catch(() => setReposts([]))
    listReplies().then(setReplies).catch(() => setReplies([]))
  }, [])

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'reposts', label: 'Reposts' },
    { key: 'replies', label: 'Replies' },
    { key: 'cart', label: 'Cart' },
    { key: 'bookmarks', label: 'Bookmarks' },
  ]

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-2">Profile</h2>
      <p className="text-gray-400 mb-4">Bio, stats, media</p>

      <div className="flex gap-3 border-b border-gray-800 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 ${tab===t.key ? 'text-gold border-b-2 border-gold' : 'text-gray-400'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {allPosts.length === 0 && <div className="text-gray-400">No posts yet.</div>}
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
    </Card>
  )
}
