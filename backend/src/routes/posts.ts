import { Router } from 'express'
import { getMongoClient } from '../mongo'
import { newId } from '../memory'
import { saveDevData } from '../dev-storage'
import { authMiddleware } from '../utils/auth'
import { getNeo4jDriver } from '../neo4j'
import { ObjectId } from 'mongodb'

const router = Router()

// create post
router.post('/', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const { title, mediaType, mediaUrl } = req.body
  const rawPrice = (req.body?.price as any)
  const price = rawPrice === undefined || rawPrice === null || rawPrice === '' ? undefined : Number(rawPrice)

  // basic validation
  if (!title || typeof title !== 'string' || !mediaType || typeof mediaType !== 'string') {
    return res.status(400).json({ error: 'title and mediaType are required' })
  }

  const post = { _id: newId(), title, mediaType, mediaUrl, ownerId: req.user.sub, likes: 0, replies: 0, reposts: 0, views: 0, createdAt: new Date(), ...(Number.isFinite(price) ? { price: Number(price) } : {}) }
  const result = await db.collection('posts').insertOne(post)

  // Sync minimal post node to Neo4j
  try {
    const driver = getNeo4jDriver()
    const session = driver.session()
  await session.executeWrite((tx: any) => tx.run('MERGE (p:Post {id:$id}) SET p.title=$title, p.createdAt=$createdAt', { id: (result as any).insertedId?.toString?.() || post._id, title, createdAt: post.createdAt.toISOString() }))
    await session.close()
  } catch (err) {
    console.warn('Could not sync post to Neo4j', err)
  }

  res.json({ id: (result as any).insertedId || post._id })
  saveDevData()
})

// DEV helper: create a post without auth for E2E/debug (disabled in production)
router.post('/debug/create', async (req: any, res: any) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'forbidden' })
  const client = getMongoClient()
  const db = client.db()
  const { title, mediaType, mediaUrl, ownerId } = req.body
  const post = { title, mediaType, mediaUrl, ownerId: ownerId || 'debug', likes: 0, replies: 0, reposts: 0, views: 0, createdAt: new Date() }
  const result = await db.collection('posts').insertOne(post)
  res.json({ id: result.insertedId, inserted: post })
})

// list posts (simple)
router.get('/', async (req, res) => {
  const client = getMongoClient()
  const db = client.db()
  const items = await db.collection('posts').find().sort({ createdAt: -1 }).limit(50).toArray()
  const ownerId = (req.query.ownerId || '').toString().trim()
  if (ownerId) {
    const filtered = items.filter((p: any) => String(p.ownerId) === ownerId)
    return res.json(filtered)
  }
  res.json(items)
})

// update post (owner only)
router.put('/:id', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const { id } = req.params
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'invalid id' })

  const updates: any = {}
  if (typeof req.body.title === 'string') updates.title = req.body.title
  if (typeof req.body.mediaUrl === 'string') updates.mediaUrl = req.body.mediaUrl
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'price')) {
    const raw = (req.body as any).price
    if (raw === '' || raw === null || raw === undefined) {
      updates.price = undefined
    } else if (!isNaN(Number(raw))) {
      updates.price = Number(raw)
    }
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'no valid fields to update' })

  const result = await db.collection('posts').updateOne({ _id: new ObjectId(id), ownerId: req.user.sub }, { $set: updates })
  if (result.matchedCount === 0) return res.status(404).json({ error: 'not found' })
  saveDevData()
  return res.status(200).json({ ok: true })
})

// delete post (owner only)
router.delete('/:id', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const { id } = req.params
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'invalid id' })
  const result = await db.collection('posts').deleteOne({ _id: new ObjectId(id), ownerId: req.user.sub })
  if (result.deletedCount === 0) return res.status(404).json({ error: 'not found' })
  saveDevData()
  return res.status(200).json({ ok: true })
})

export default router
