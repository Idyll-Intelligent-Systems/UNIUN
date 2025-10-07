import ContentCard from '../components/ContentCard'
import { useEffect, useState } from 'react'
import AuthModal from '../components/AuthModal'
import api from '../utils/api'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [authed, setAuthed] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true
  // gate by auth: user must be logged in to view posts
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) { setAuthed(false); return }
  setAuthed(true)
  api.listPosts().then((items: any[]) => {
      if (!mounted) return
      const mapped = (items || []).map(p => ({
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
      setPosts(mapped)
    }).catch(() => {
      // keep posts empty
    })
    return () => { mounted = false }
  }, [])

  return (
    <>
      <header className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">UNIUN — Creator Monetization (feed)</h1>
      </header>
      <section className="p-6 grid gap-6">
        {!authed && (
          <div className="max-w-md">
            <AuthModal/>
          </div>
        )}
        {authed && (posts.length === 0) ? (
          <div className="text-gray-400">No posts yet — try creating one from /upload</div>
        ) : authed ? posts.map((s) => (
          <ContentCard key={s.id} item={s} />
        )) : null}
      </section>
    </>
  )
}
