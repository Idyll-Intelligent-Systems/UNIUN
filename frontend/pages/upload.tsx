import { useState } from 'react'
import { createPost } from '../utils/api'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function Upload() {
  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState('image')
    const [file, setFile] = useState<File | null>(null)

  async function submit() {
    try {
      if (!title.trim()) { alert('Enter a title'); return }
        let publicUrl: string | undefined
      if (file) {
        try {
            const form = new FormData()
            form.append('file', file)
            const uploadRes = await fetch((process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002') + '/api/media/upload', {
              method: 'POST',
              headers: { 'Authorization': typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('token') || ''}` : '' } as any,
              body: form,
            })
            if (!uploadRes.ok) return alert('Upload failed')
            const data = await uploadRes.json()
            publicUrl = data.publicUrl
        } catch (e) {
          // ignore upload failure, proceed without mediaUrl
        }
      }
        await createPost(title, mediaType, publicUrl)
      setTitle('')
      // Navigate home so user can see the post
      if (typeof window !== 'undefined') window.location.href = '/'
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Upload</h2>
      <input className="w-full mb-2 p-2 rounded bg-gray-900" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="block text-sm mb-1" htmlFor="mediaType">Media Type</label>
  <select id="mediaType" aria-label="Media Type" className="w-full mb-4 p-2 rounded bg-gray-900" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
        <option value="image">Image</option>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
      </select>
      <label className="block text-sm mb-1" htmlFor="mediaFile">Media File (optional)</label>
      <input id="mediaFile" type="file" className="w-full mb-4 p-2 rounded bg-gray-900"
        onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
      <div className="flex items-center justify-between">
        <a href="/" className="text-gray-400 hover:text-white">Back</a>
        <Button onClick={submit}>Upload</Button>
      </div>
    </Card>
  )
}
