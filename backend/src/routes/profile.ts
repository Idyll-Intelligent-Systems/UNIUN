import { Router } from 'express'
import { authMiddleware } from '../utils/auth'
import { mem } from '../memory'

const router = Router()

router.get('/bookmarks', authMiddleware, (req: any, res: any) => {
  const list = mem.bookmarks.filter(b => b.userId === req.user.sub)
  res.json(list)
})

router.get('/reposts', authMiddleware, (req: any, res: any) => {
  const list = mem.reposts.filter(r => r.userId === req.user.sub)
  res.json(list)
})

router.get('/replies', authMiddleware, (req: any, res: any) => {
  const list = mem.replies.filter(r => r.userId === req.user.sub)
  res.json(list)
})

export default router
