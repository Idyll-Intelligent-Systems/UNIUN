import { Router } from 'express'
import { mem } from '../memory'
import { getMongoClient } from '../mongo'

const router = Router()

router.get('/', async (req: any, res: any) => {
  const qRaw: string = (req.query.q || '').toString()
  const q = qRaw.toLowerCase().trim()
  if (!q) return res.json({ users: [], posts: [] })

  // Try DB first
  try {
    const db = getMongoClient().db()
    const [users, posts] = await Promise.all([
      db.collection('users').find({ username: { $regex: qRaw, $options: 'i' } }).limit(20).toArray(),
      db.collection('posts').find({ title: { $regex: qRaw, $options: 'i' } }).limit(20).toArray(),
    ])
    return res.json({ users, posts })
  } catch (e) {
    // Fallback to memory
    const users = mem.users.filter(u => u.username.toLowerCase().includes(q))
    const posts = mem.posts.filter(p => (p.title || '').toLowerCase().includes(q))
    return res.json({ users, posts })
  }
})

export default router
