import { useEffect, useState } from 'react'
import { createPost } from '../utils/api'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import AuthModal from '../components/AuthModal'
import { useToast } from '../components/ui/Toast'
import EmojiPicker from '../components/ui/EmojiPicker'
//

export default function Upload() {
  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState('image')
    const [file, setFile] = useState<File | null>(null)
  const [authed, setAuthed] = useState(true)
  const [price, setPrice] = useState<string>('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { show } = useToast()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setAuthed(!!token)
  }, [])

  const MAX_TITLE_LEN = 280
  async function submit() {
    try {
  if (!title.trim()) { show('Enter a title', 'warning'); return }
      if (title.length > MAX_TITLE_LEN) { show(`Title too long (max ${MAX_TITLE_LEN})`, 'warning'); return }
        let publicUrl: string | undefined
        let effectiveMediaType = mediaType
        if (file) {
          try {
              const form = new FormData()
              form.append('file', file)
              const uploadRes = await fetch('/api/media/upload', {
                method: 'POST',
                headers: { 'Authorization': typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('token') || ''}` : '' } as any,
                body: form,
              })
              if (!uploadRes.ok) { show('Upload failed', 'error'); return }
              const data = await uploadRes.json()
              publicUrl = data.publicUrl
              // infer media type from returned category if available
              if (data?.category === 'video') effectiveMediaType = 'video'
              else if (data?.category === 'audio') effectiveMediaType = 'audio'
              else effectiveMediaType = 'image'
          } catch (e) {
            show('Upload failed', 'error');
            return
          }
        }
        const parsedPrice = price.trim() === '' ? undefined : Number(price)
        await createPost(title, effectiveMediaType, publicUrl, (isFinite(parsedPrice as number) ? (parsedPrice as number) : undefined))
      setTitle('')
      setPrice('')
      show('Upload succeeded', 'success')
      // Navigate home so user can see the post
      if (typeof window !== 'undefined') window.location.href = '/'
    } catch (err: any) {
      show('Upload failed', 'error')
    }
  }

  if (!authed) return <AuthModal />

  return (
    <Card className="p-4 glass shadow-premium border border-white/10">
      <h2 className="heading-premium text-2xl mb-4">Upload</h2>
      <div className="relative mb-3">
        <input className="w-full p-3 pr-12 rounded-lg bg-white/10 text-premium border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder={`Title (max ${MAX_TITLE_LEN})`} value={title} onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LEN))} />
        <Button className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1" onClick={() => setShowEmojis(s => !s)} aria-label="Insert emoji">😊</Button>
        {showEmojis && (
          <EmojiPicker onSelect={(e) => { setTitle(t => (t + e)); setShowEmojis(false) }} onClose={() => setShowEmojis(false)} anchorClass="right-0" />
        )}
      </div>
      <label className="block text-sm mb-1" htmlFor="mediaType">Media Type</label>
      <select id="mediaType" aria-label="Media Type" className="w-full mb-4 p-3 rounded-lg bg-white/10 text-premium border border-white/20" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
        <option value="image">Image</option>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
      </select>
      <label className="block text-sm mb-1" htmlFor="mediaFile">Media File (optional)</label>
      <input id="mediaFile" type="file" className="w-full mb-4 p-2 rounded-lg bg-white/10 text-premium border border-white/20"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
          setFile(f)
          // generate local preview
          try { setPreviewUrl(f ? URL.createObjectURL(f) : null) } catch { setPreviewUrl(null) }
        }} />
      {previewUrl && (
        <div className="mb-4">
          {mediaType === 'video' ? (
            <video controls className="w-full rounded-lg shadow-premium"><source src={previewUrl} /></video>
          ) : mediaType === 'audio' ? (
            <audio controls className="w-full"><source src={previewUrl} /></audio>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="preview" className="w-full rounded-lg shadow-premium" />
          )}
        </div>
      )}
      <label className="block text-sm mb-1" htmlFor="price">Price (optional)</label>
      <input id="price" type="number" min="0" step="0.01" className="w-full mb-4 p-3 rounded-lg bg-white/10 text-premium border border-white/20" placeholder="e.g. 4.99"
        value={price} onChange={(e) => setPrice(e.target.value)} />
      <div className="flex items-center justify-between">
        <a href="/" className="text-gray-400 hover:text-white">Back</a>
        <Button onClick={submit}>Upload</Button>
      </div>
    </Card>
  )
}
