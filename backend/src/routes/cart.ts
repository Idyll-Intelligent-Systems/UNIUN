import { Router } from 'express'
import { getMongoClient } from '../mongo'
import { authMiddleware } from '../utils/auth'

const router = Router()

router.post('/add', authMiddleware, async (req: any, res: any) => {
  const { itemId, price } = req.body
  if (!itemId) return res.status(400).json({ error: 'itemId required' })
  const db = getMongoClient().db()
  await db.collection('carts').updateOne({ userId: req.user.sub }, { $push: { items: { itemId, price } } }, { upsert: true })
  res.json({ ok: true })
})

router.get('/', authMiddleware, async (req: any, res: any) => {
  const db = getMongoClient().db()
  const cart = await db.collection('carts').findOne({ userId: req.user.sub })
  res.json(cart || { items: [] })
})

router.post('/checkout', authMiddleware, async (req: any, res: any) => {
  // Mock checkout flow — return a pretend URL
  res.json({ url: `https://checkout.example.com/session/${Math.random().toString(36).slice(2)}` })
})

export default router
