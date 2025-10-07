import { Card } from '../components/ui/Card'
import ContentCard from '../components/ContentCard'
import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function Shop() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    api.listPosts().then((posts: any[]) => {
      if (!mounted) return
      const mapped = (posts || []).map(p => ({
        id: p.id || p._id || (p._id && p._id.toString()),
        title: p.title,
        mediaType: p.mediaType || 'image',
        mediaUrl: p.mediaUrl || null,
        likes: p.likes || 0,
        replies: p.replies || 0,
        reposts: p.reposts || 0,
        views: p.views || 0,
        price: typeof p.price === 'number' ? p.price : undefined,
      }))
      setItems(mapped)
    }).catch(() => setItems([]))
    return () => { mounted = false }
  }, [])
  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Shop</h2>
      <div className="grid gap-4">
        {items.length === 0 && <div className="text-gray-500">No posts available.</div>}
        {items.map(s => <ContentCard key={s.id} item={s as any} />)}
      </div>
    </Card>
  )
}
