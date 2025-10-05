import Layout from '../components/Layout'
import { useState } from 'react'
import { createPost } from '../utils/api'
import Button from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function Upload() {
  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState('image')

  async function submit() {
    try {
      await createPost(title, mediaType)
      alert('Post created')
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <Layout>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Upload</h2>
        <input className="w-full mb-2 p-2 rounded bg-gray-900" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="w-full mb-4 p-2 rounded bg-gray-900" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
        <div className="text-right"><Button onClick={submit}>Upload</Button></div>
      </Card>
    </Layout>
  )
}
