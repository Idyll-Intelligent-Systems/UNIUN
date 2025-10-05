import { Card } from './ui/Card'
import Button from './ui/Button'
import Icons from './ui/icons'
import { useState } from 'react'
import api from '../utils/api'

type Content = {
  id?: string
  _id?: any
  title?: string
  mediaType?: 'image' | 'video' | 'audio'
  mediaUrl?: string
  likes?: number
  replies?: number
  reposts?: number
  views?: number
}

export default function ContentCard({ item }: { item: any }) {
  const [likes, setLikes] = useState(item?.likes || 0)
  const [reposts, setReposts] = useState(item?.reposts || 0)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  // normalize id value (Mongo returns _id sometimes)
  const safeId = item?.id || (item?._id ? (typeof item._id === 'string' ? item._id : item._id.toString()) : undefined)

  async function onLike() {
    if (!safeId) return
    setLikes((l: number) => l + 1)
    try {
      await api.likePost(safeId)
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
    }
  }

  async function onRepost() {
    if (!safeId) return
    setReposts((r: number) => r + 1)
    try {
      await api.repostPost(safeId)
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
    }
  }

  async function onBookmark() {
    if (!safeId) return
    setBookmarked(b => !b)
    try {
      await api.bookmarkPost(safeId)
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
    }
  }

  async function onAddToCart() {
    if (!safeId) return
    setLoading(true)
    try {
      // api expects { id, title }
      await api.addToCart({ id: safeId, title: item?.title, price: 0 })
    } catch (e) {
      console.error('add to cart failed', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full overflow-hidden" >
      <div className="w-full h-64 bg-gradient-to-t from-black to-gray-900 flex items-center justify-center">
        <span className="text-gray-500">{(item?.mediaType || 'image').toString().toUpperCase()} PLACEHOLDER</span>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold">{item?.title}</h3>
        <div className="mt-3 flex items-center justify-between text-gray-300 text-sm">
          <div className="flex gap-4 items-center">
            <button onClick={onLike} className="flex items-center gap-1">
              <Icons.Heart size={16} />{likes}
            </button>
            <div className="flex items-center gap-1"><Icons.Message size={16} />{item?.replies || 0}</div>
            <button onClick={onRepost} className="flex items-center gap-1">
              <Icons.Repeat size={16} />{reposts}
            </button>
            <div className="flex items-center gap-1"><Icons.Eye size={16} />{item?.views || 0}</div>
          </div>
          <div className="flex gap-3">
            <Button onClick={onAddToCart} disabled={loading} className="text-gold">{loading ? 'Adding...' : 'Add to cart'}</Button>
            <Button onClick={onBookmark} className={`text-gray-300 ${bookmarked ? 'opacity-70' : ''}`}>{bookmarked ? 'Bookmarked' : 'Wishlist'}</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
