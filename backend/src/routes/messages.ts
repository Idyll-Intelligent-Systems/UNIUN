import { Router } from 'express'
import { authMiddleware } from '../utils/auth'

type Msg = { id: string; from: string; to: string; text: string; createdAt: Date }
const messages: Msg[] = []
// last read timestamp per user conversation: key `${userId}|${otherId}` -> Date
const lastReads = new Map<string, Date>()

const router = Router()

// List conversation summaries for current user
router.get('/', authMiddleware, (req: any, res: any) => {
  const me = String(req.user.sub)
  // Gather unique peers
  const peers = new Set<string>()
  for (const m of messages) {
    if (m.from === me) peers.add(m.to)
    if (m.to === me) peers.add(m.from)
  }
  const list = Array.from(peers).map((other) => {
    const conv = messages.filter((m) => (m.from === me && m.to === other) || (m.from === other && m.to === me))
    const last = conv[conv.length - 1] || null
    const key = `${me}|${other}`
    const lr = lastReads.get(key) || new Date(0)
    const unread = conv.filter((m) => m.to === me && m.createdAt > lr).length
    return { userId: other, lastMessage: last, unread }
  })
  res.json(list)
})

// Total unread count for badge
router.get('/unread-count', authMiddleware, (req: any, res: any) => {
  const me = String(req.user.sub)
  let total = 0
  const seen = new Set<string>()
  for (const m of messages) {
    const other = m.from === me ? m.to : m.to === me ? m.from : null
    if (!other) continue
    if (seen.has(other)) continue
    const key = `${me}|${other}`
    const lr = lastReads.get(key) || new Date(0)
    const unread = messages.filter((x) => ((x.from === other && x.to === me) && x.createdAt > lr)).length
    total += unread
    seen.add(other)
  }
  res.json({ total })
})

// Thread messages; marks as read
router.get('/:withUserId', authMiddleware, (req: any, res: any) => {
  const me = String(req.user.sub)
  const other = String(req.params.withUserId)
  const thread = messages.filter(m => (m.from === me && m.to === other) || (m.from === other && m.to === me))
  // mark as read now
  lastReads.set(`${me}|${other}`, new Date())
  res.json(thread)
})

router.post('/:withUserId', authMiddleware, (req: any, res: any) => {
  const me = String(req.user.sub)
  const other = String(req.params.withUserId)
  const text = (req.body?.text || '').toString().slice(0, 2000)
  if (!text) return res.status(400).json({ error: 'text required' })
  const id = Math.random().toString(36).slice(2)
  const msg: Msg = { id, from: me, to: other, text, createdAt: new Date() }
  messages.push(msg)
  res.json(msg)
})

export default router
