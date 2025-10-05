import ContentCard from '../components/ContentCard'
import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    api.listPosts().then((items: any[]) => {
      if (!mounted) return
      const mapped = (items || []).map(p => ({
        id: p.id || p._id || (p._id && p._id.toString()),
        title: p.title,
        mediaType: p.mediaType || 'image',
        likes: p.likes || 0,
        replies: p.replies || 0,
        reposts: p.reposts || 0,
        views: p.views || 0
      }))
      setPosts(mapped)
    }).catch(() => {
      // keep posts empty
    })
    return () => { mounted = false }
  }, [])

  return (
    <Layout>
      <header className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">UNIUN — Creator Monetization (feed)</h1>
      </header>
      <section className="p-6 grid gap-6">
        {posts.length === 0 ? (
          <div className="text-gray-400">No posts yet — try creating one from /upload</div>
        ) : posts.map((s) => (
          <ContentCard key={s.id} item={s} />
        ))}
      </section>
    </Layout>
  )
}
