import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { saveDevData } from '../dev-storage'
import { mem } from '../memory'
import { getMongoClient } from '../mongo'
import { authMiddleware } from '../utils/auth'

const router = Router()

router.post('/:postId/like', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const postId = req.params.postId
  await db.collection('posts').updateOne({ _id: ObjectId.isValid(postId) ? new ObjectId(postId) : postId }, { $inc: { likes: 1 } })
  saveDevData()
  res.json({ ok: true })
})

router.post('/:postId/repost', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const postId = req.params.postId
  await db.collection('posts').updateOne({ _id: ObjectId.isValid(postId) ? new ObjectId(postId) : postId }, { $inc: { reposts: 1 } })
  // record repost in memory list for profile tab
  mem.reposts.push({ userId: req.user.sub, postId, createdAt: new Date() })
  saveDevData()
  res.json({ ok: true })
})

router.post('/:postId/bookmark', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const userId = req.user.sub
  const postId = req.params.postId
  await db.collection('bookmarks').updateOne({ userId, postId }, { $set: { userId, postId, createdAt: new Date() } }, { upsert: true })
  saveDevData()
  res.json({ ok: true })
})

// simple reply to a post
router.post('/:postId/reply', authMiddleware, async (req: any, res: any) => {
  const { text } = req.body
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' })
  const postId = req.params.postId
  mem.replies.push({ userId: req.user.sub, postId, text, createdAt: new Date() })
  // bump replies count on post in memory shim path
  await getMongoClient().db().collection('posts').updateOne({ _id: ObjectId.isValid(postId) ? new ObjectId(postId) : postId }, { $inc: { replies: 1 } })
  saveDevData()
  res.json({ ok: true })
})

export default router
