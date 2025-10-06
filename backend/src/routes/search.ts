import { Router } from 'express'
import { mem } from '../memory'

const router = Router()

router.get('/', (req: any, res: any) => {
  const q: string = (req.query.q || '').toString().toLowerCase().trim()
  if (!q) return res.json({ users: [], posts: [] })
  const users = mem.users.filter(u => u.username.toLowerCase().includes(q))
  const posts = mem.posts.filter(p => (p.title || '').toLowerCase().includes(q))
  res.json({ users, posts })
})

export default router
