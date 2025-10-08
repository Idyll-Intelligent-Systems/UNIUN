import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../utils/api'

const MAX_TITLE_LEN = 280

export default function EditPost() {
  const router = useRouter()
  const { id } = router.query
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const posts = await api.listPosts()
        const p = (posts || []).find((x:any)=> (x.id || x._id || (x._id && x._id.toString())) === id)
        if (p) setTitle(p.title || '')
      } catch {}
    })()
  }, [id])

  async function save() {
    setError(null)
    if (!id || typeof id !== 'string') return
    if (!title.trim()) { setError('Enter a title'); return }
    if (title.length > MAX_TITLE_LEN) { setError(`Title too long (max ${MAX_TITLE_LEN})`); return }
    setLoading(true)
    try {
      await api.api(`/api/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ title }), headers: { 'Content-Type': 'application/json' }})
      router.push('/profile')
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally { setLoading(false) }
  }

  return (
    <Card className="p-4 glass border border-white/10">
      <h2 className="heading-premium text-2xl mb-3">Edit Post</h2>
      <input value={title} onChange={e=>setTitle(e.target.value.slice(0, MAX_TITLE_LEN))} placeholder={`Title (max ${MAX_TITLE_LEN})`} className="w-full p-3 rounded bg-white/10 border border-white/20 text-premium mb-2" />
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      <div className="flex items-center justify-end gap-2">
        <a href="/profile" className="text-gray-400">Cancel</a>
        <Button onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
      </div>
    </Card>
  )
}
