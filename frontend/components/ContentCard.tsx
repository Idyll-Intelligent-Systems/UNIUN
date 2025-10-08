import { Card } from './ui/Card'
import Button from './ui/Button'
import Icons from './ui/icons'
import { useEffect, useRef, useState } from 'react'
import api from '../utils/api'
// Use plain media tags to avoid Next Image constraints with ALB
import { useToast } from './ui/Toast'
import { normalizeMediaUrl } from '../utils/media'

export default function ContentCard({ item }: { item: any }) {
  const [likes, setLikes] = useState(item?.likes || 0)
  const [reposts, setReposts] = useState(item?.reposts || 0)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [replies, setReplies] = useState(item?.replies || 0)
  const [views, setViews] = useState(item?.views || 0)
  const [me, setMe] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const likeBusy = useRef(false)
  const repostBusy = useRef(false)
  const viewedOnce = useRef(false)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const { show } = useToast()

  // normalize id value (Mongo returns _id sometimes)
  const safeId = item?.id || (item?._id ? (typeof item._id === 'string' ? item._id : item._id.toString()) : undefined)

  async function onLike() {
    if (!safeId) return
    if (likeBusy.current) return
    likeBusy.current = true
    // optimistic toggle
    setLikes((l: number) => liked ? Math.max(0, l - 1) : l + 1)
    try {
      const res:any = await api.likePost(safeId)
      setLiked(!!res?.liked)
      if (typeof res?.likes === 'number') setLikes(Math.max(0, res.likes))
      show(res?.liked ? 'Liked' : 'Unliked', 'success')
    } catch (e) {
      // revert
      setLikes((l: number) => liked ? l + 1 : Math.max(0, l - 1))
      console.error('like failed', e)
      show('Like failed', 'error')
    } finally {
      likeBusy.current = false
    }
  }

  async function onRepost() {
    if (!safeId) return
    if (repostBusy.current) return
    repostBusy.current = true
    // optimistic toggle: don't change count to avoid double flicker; rely on server count
    try {
      const res:any = await api.repostPost(safeId)
      setReposted(!!res?.reposted)
      if (typeof res?.reposts === 'number') setReposts(Math.max(0, res.reposts))
      show(res?.reposted ? 'Reposted' : 'Undo repost', 'success')
    } catch (e) {
      // no local change since we depend on rehydrate
      console.error('repost failed', e)
      show('Repost failed', 'error')
    } finally {
      repostBusy.current = false
    }
  }

  async function onBookmark() {
    if (!safeId) return
    setBookmarked(b => !b)
    try {
      const res:any = await api.bookmarkPost(safeId)
      show(res?.bookmarked ? 'Added to wishlist' : 'Removed from wishlist', 'success')
      // optional rehydrate
      try {
        const posts = await api.listPosts()
        const fresh = (posts || []).find((p: any) => (p.id || (p._id && p._id.toString())) === safeId)
        if (fresh) {
          setLikes(fresh.likes || 0)
          setReposts(fresh.reposts || 0)
        }
      } catch (e) {}
    } catch (e) {
      setBookmarked(b => !b)
      console.error('bookmark failed', e)
      show('Wishlist update failed', 'error')
    }
  }

  async function onAddToCart() {
    if (!safeId) return
    setLoading(true)
    try {
      // api expects { id, title }
      const p = typeof item?.price === 'number' && isFinite(item.price) ? item.price : undefined
      await api.addToCart({ id: safeId, title: item?.title, price: p })
      show('Added to cart', 'success')
    } catch (e) {
      console.error('add to cart failed', e)
      show('Add to cart failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const media = normalizeMediaUrl(item?.mediaUrl)
  // load current user to decide owner controls
  useState(() => {
    api.me().then(async (m:any) => {
      setMe(m)
      if (safeId) {
        try {
          const s:any = await api.interactionStatus(safeId)
          setLiked(!!s?.liked)
          setReposted(!!s?.reposted)
          setBookmarked(!!s?.bookmarked)
        } catch { /* ignore */ }
      }
    }).catch(()=>setMe(null))
  })

  // unique view tracking: fire once when card first enters viewport
  useEffect(() => {
    if (!safeId) return
    if (viewedOnce.current) return
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting && !viewedOnce.current) {
          viewedOnce.current = true
          try {
            const res: any = await api.viewPost(safeId)
            if (typeof res?.views === 'number') setViews(res.views)
          } catch {
            // ignore
          }
          obs.disconnect()
        }
      })
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [safeId])

  async function onDelete() {
    if (!safeId) return
    if (!confirm('Delete this post?')) return
    try {
      await api.deletePost(safeId)
      // Optimistically remove from page by dispatching a DOM event that parent pages can handle
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('post:deleted', { detail: { id: safeId } }))
      show('Post deleted', 'success')
    } catch (e: any) {
      alert('Delete failed: ' + e.message)
      show('Delete failed', 'error')
    }
  }
  return (
  <Card ref={cardRef as any} className="w-full glass shadow-premium transition-premium overflow-hidden border border-white/10">
    {media && (
      <div className="relative w-full bg-gradient-to-t from-black/80 to-gray-900/80 flex items-center justify-center overflow-hidden">
        {/* Media block only when media exists */}
        <a href={`/posts/${encodeURIComponent(String(safeId || ''))}`} className="relative w-full" style={{ aspectRatio: '4 / 5' }}>
          {item?.mediaType === 'video' ? (
            <video controls playsInline className="absolute inset-0 w-full h-full object-cover"><source src={media} /></video>
          ) : item?.mediaType === 'audio' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
              <audio controls className="w-full max-w-xl"><source src={media} /></audio>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media} alt={item?.title || 'media'} className="absolute inset-0 w-full h-full object-cover" />
          )}
        </a>
      </div>
    )}
  <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="heading-premium truncate max-w-[70vw] sm:max-w-none">
          <a href={`/posts/${encodeURIComponent(String(safeId || ''))}`} className="hover:underline">
            {item?.title}
          </a>
        </h3>
        {(me && String(me.id || me._id) === String(item?.ownerId)) && (
          <div className="flex items-center gap-1">
            <a href={`/edit/${encodeURIComponent(String(safeId || ''))}`} aria-label="Edit post" title="Edit post" className="text-gray-300 hover:text-gray-100 p-1 rounded transition-premium">
              <Icons.Edit size={18} />
            </a>
            <button onClick={onDelete} aria-label="Delete post" title="Delete post" className="text-red-400 hover:text-red-300 p-1 rounded transition-premium">
              <Icons.Trash size={18} />
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-premium text-sm gap-3">
        <div className="flex gap-5 items-center">
          <button data-testid="like-btn" onClick={onLike} className={`flex items-center gap-1 transition-premium ${liked ? 'text-red-500 scale-105' : ''}`}>
            <Icons.Heart size={18} />{likes}
          </button>
          <div className="flex items-center gap-1"><Icons.Message size={18} />{replies}</div>
          <button data-testid="repost-btn" onClick={onRepost} className={`flex items-center gap-1 transition-premium ${reposted ? 'text-green-400 scale-105' : ''}`}>
            <Icons.Repeat size={18} />{reposts}
          </button>
          <div className="flex items-center gap-1"><Icons.Eye size={18} />{views}</div>
        </div>
  <div className="flex gap-3 sm:gap-4 items-center">
          <span className="text-gold font-medium text-lg">{(typeof item?.price === 'number' && isFinite(item.price)) ? `Cost: $${item.price.toFixed(2)}` : 'Free'}</span>
          <Button onClick={onAddToCart} disabled={loading} className="text-gold transition-premium">{loading ? 'Adding...' : 'Add to cart'}</Button>
          <Button data-testid="bookmark-btn" onClick={onBookmark} className={`text-gray-300 transition-premium ${bookmarked ? 'opacity-70' : ''}`}>{bookmarked ? 'Bookmarked' : 'Wishlist'}</Button>
        </div>
      </div>
    </div>
  <div className="p-4 sm:p-5 border-t border-white/10 flex gap-2 bg-black/10 relative">
      <input value={reply} onChange={(e:any)=>setReply(e.target.value)} className="flex-1 p-3 pr-12 bg-white/10 rounded-lg text-premium border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder="Reply…" />
      <Button className="absolute right-28 top-1/2 -translate-y-1/2 px-2 py-1" onClick={() => setReply(r => r + '😊')}>😊</Button>
    <Button onClick={async ()=>{
        if (!safeId || !reply.trim()) return
        if (!reply.trim()) { show('Reply cannot be empty', 'warning'); return }
        const text = reply
        setReply('')
        try { await api.replyPost(safeId, text); setReplies((r: number)=>r+1); show('Reply posted', 'success') } catch(e){ console.error('reply failed', e); show('Reply failed', 'error') }
      }}>Reply</Button>
    </div>
  </Card>
  )
}
