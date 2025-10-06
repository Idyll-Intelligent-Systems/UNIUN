import { Router } from 'express'
import { getMongoClient } from '../mongo'
import { authMiddleware } from '../utils/auth'
import { saveDevData } from '../dev-storage'

const router = Router()

router.post('/add', authMiddleware, async (req: any, res: any) => {
  const { itemId, id, price } = req.body
  const normalizedId = itemId || id
  if (!normalizedId) return res.status(400).json({ error: 'itemId required' })
  const db = getMongoClient().db()
  await db.collection('carts').updateOne({ userId: req.user.sub }, { $push: { items: { itemId: normalizedId, price: typeof price === 'number' ? price : 0 } } }, { upsert: true })
  saveDevData()
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
