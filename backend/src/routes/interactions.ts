import { Router } from 'express'
import { getMongoClient } from '../mongo'
import { authMiddleware } from '../utils/auth'

const router = Router()

router.post('/:postId/like', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const postId = req.params.postId
  await db.collection('posts').updateOne({ _id: new (require('mongodb').ObjectId)(postId) }, { $inc: { likes: 1 } })
  res.json({ ok: true })
})

router.post('/:postId/repost', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const postId = req.params.postId
  await db.collection('posts').updateOne({ _id: new (require('mongodb').ObjectId)(postId) }, { $inc: { reposts: 1 } })
  res.json({ ok: true })
})

router.post('/:postId/bookmark', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const userId = req.user.sub
  const postId = req.params.postId
  await db.collection('bookmarks').updateOne({ userId, postId }, { $set: { userId, postId, createdAt: new Date() } }, { upsert: true })
  res.json({ ok: true })
})

export default router
