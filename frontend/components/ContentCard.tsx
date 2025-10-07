import { Card } from './ui/Card'
import Button from './ui/Button'
import Icons from './ui/icons'
import { useState } from 'react'
import api from '../utils/api'
import Image from 'next/image'
import { useToast } from './ui/Toast'

export default function ContentCard({ item }: { item: any }) {
  const [likes, setLikes] = useState(item?.likes || 0)
  const [reposts, setReposts] = useState(item?.reposts || 0)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [replies, setReplies] = useState(item?.replies || 0)
  const [me, setMe] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const { show } = useToast()

  // normalize id value (Mongo returns _id sometimes)
  const safeId = item?.id || (item?._id ? (typeof item._id === 'string' ? item._id : item._id.toString()) : undefined)

  async function onLike() {
    if (!safeId) return
    setLikes((l: number) => l + 1)
    try {
      await api.likePost(safeId)
      setLiked(true)
      show('Liked', 'success')
      // rehydrate this post from server for strong consistency
      try {
        const posts = await api.listPosts()
        const fresh = (posts || []).find((p: any) => (p.id || (p._id && p._id.toString())) === safeId)
        if (fresh) {
          setLikes(fresh.likes || 0)
          setReposts(fresh.reposts || 0)
        }
      } catch (e) {
        // ignore rehydrate failures
      }
    } catch (e) {
      setLikes((l: number) => l - 1)
      console.error('like failed', e)
      show('Like failed', 'error')
    }
  }

  async function onRepost() {
    if (!safeId) return
    setReposts((r: number) => r + 1)
    try {
      await api.repostPost(safeId)
      show('Reposted', 'success')
      try {
        const posts = await api.listPosts()
        const fresh = (posts || []).find((p: any) => (p.id || (p._id && p._id.toString())) === safeId)
        if (fresh) {
          setLikes(fresh.likes || 0)
          setReposts(fresh.reposts || 0)
        }
      } catch (e) {}
    } catch (e) {
      setReposts((r: number) => r - 1)
      console.error('repost failed', e)
      show('Repost failed', 'error')
    }
  }

  async function onBookmark() {
    if (!safeId) return
    setBookmarked(b => !b)
    try {
      await api.bookmarkPost(safeId)
      show(bookmarked ? 'Removed from wishlist' : 'Added to wishlist', 'success')
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

  const media = (item?.mediaUrl && typeof item.mediaUrl === 'string') ? item.mediaUrl : null
  // load current user to decide owner controls
  useState(() => {
    api.me().then(setMe).catch(()=>setMe(null))
  })

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
    <Card className="w-full overflow-hidden" >
      <div className="relative w-full h-64 bg-gradient-to-t from-black to-gray-900 flex items-center justify-center overflow-hidden">
        {media ? (
          item?.mediaType === 'video' ? (
            <video controls className="w-full h-full object-cover"><source src={media} /></video>
          ) : item?.mediaType === 'audio' ? (
            <audio controls className="w-full"><source src={media} /></audio>
          ) : (
            <Image src={media} alt={item?.title || 'media'} fill style={{ objectFit: 'cover' }} sizes="100vw" />
          )
        ) : (
          <span className="text-gray-500">{(item?.mediaType || 'image').toString().toUpperCase()} PLACEHOLDER</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-white font-semibold truncate">{item?.title}</h3>
          {(me && (me.id === item?.ownerId || me._id === item?.ownerId)) && (
            <button onClick={onDelete} aria-label="Delete post" title="Delete post" className="text-red-400 hover:text-red-300 p-1 rounded">
              <Icons.Trash size={18} />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-gray-300 text-sm">
          <div className="flex gap-4 items-center">
            <button data-testid="like-btn" onClick={onLike} className={`flex items-center gap-1 ${liked ? 'text-red-500' : ''}`}>
              <Icons.Heart size={16} />{likes}
            </button>
            <div className="flex items-center gap-1"><Icons.Message size={16} />{replies}</div>
            <button data-testid="repost-btn" onClick={onRepost} className="flex items-center gap-1">
              <Icons.Repeat size={16} />{reposts}
            </button>
            <div className="flex items-center gap-1"><Icons.Eye size={16} />{item?.views || 0}</div>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-gold font-medium">{(typeof item?.price === 'number' && isFinite(item.price)) ? `Cost: $${item.price.toFixed(2)}` : 'Free'}</span>
            <Button onClick={onAddToCart} disabled={loading} className="text-gold">{loading ? 'Adding...' : 'Add to cart'}</Button>
            <Button data-testid="bookmark-btn" onClick={onBookmark} className={`text-gray-300 ${bookmarked ? 'opacity-70' : ''}`}>{bookmarked ? 'Bookmarked' : 'Wishlist'}</Button>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-gray-800 flex gap-2">
        <input value={reply} onChange={e=>setReply(e.target.value)} className="flex-1 p-2 bg-gray-800 rounded" placeholder="Reply…" />
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
