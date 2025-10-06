import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useState } from 'react'

function api(path: string, opts: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
  return fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, ...opts }).then(r => r.json())
}

export default function Tools() {
  const [busy, setBusy] = useState(false)
  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Tools</h2>
      <div className="flex flex-col gap-2">
        <Button onClick={async () => { setBusy(true); await api('/api/dev/clear'); setBusy(false); alert('Cleared dev data') }} disabled={busy}>Clear Dev Data</Button>
        <Button onClick={async () => { setBusy(true); await api('/api/dev/seed'); setBusy(false); alert('Seeded demo posts') }} disabled={busy}>Seed Demo Content</Button>
        <a className="text-sm text-gray-400 hover:text-white" href="/">Back to Home</a>
      </div>
    </Card>
  )
}
