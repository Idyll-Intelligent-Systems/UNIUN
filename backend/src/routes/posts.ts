import { Router } from 'express'
import { getMongoClient } from '../mongo'
import { newId } from '../memory'
import { saveDevData } from '../dev-storage'
import { authMiddleware } from '../utils/auth'
import { getNeo4jDriver } from '../neo4j'
import { ObjectId } from 'mongodb'

const router = Router()
const MAX_TITLE_LEN = 280

// create post
router.post('/', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const { title, mediaUrl } = req.body
  let { mediaType } = req.body as any
  const rawPrice = (req.body?.price as any)
  const price = rawPrice === undefined || rawPrice === null || rawPrice === '' ? undefined : Number(rawPrice)

  // basic validation
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' })
  }
  if (title.length > MAX_TITLE_LEN) {
    return res.status(400).json({ error: `title too long (max ${MAX_TITLE_LEN})` })
  }

  // If client uploaded mediaUrl but omitted or mismatched mediaType, infer from url extension
  function inferType(url?: string): string | null {
    if (!url || typeof url !== 'string') return null
    const u = url.toLowerCase()
    if (u.match(/\.(mp4|webm|mov|m4v)$/)) return 'video'
    if (u.match(/\.(mp3|wav|m4a|ogg)$/)) return 'audio'
    if (u.match(/\.(png|jpg|jpeg|gif|webp|avif|bmp)$/)) return 'image'
    return null
  }
  const inferred = inferType(mediaUrl)
  if (!mediaType || typeof mediaType !== 'string') mediaType = inferred || 'image'
  if (inferred && mediaType !== inferred) mediaType = inferred

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
  // Normalize mediaUrl to absolute path if present and relative
  const origin = `${req.protocol}://${req.get('host')}`
  const normalized = items.map((p: any) => {
    if (p.mediaUrl && typeof p.mediaUrl === 'string' && !/^https?:\/\//i.test(p.mediaUrl)) {
      const path = p.mediaUrl.startsWith('/') ? p.mediaUrl : `/${p.mediaUrl}`
      return { ...p, mediaUrl: `${origin}${path}` }
    }
    return p
  })
  res.json(normalized)
})

// get single post by id
router.get('/:id', async (req, res) => {
  const client = getMongoClient()
  const db = client.db()
  const idStr = String(req.params.id)
  const filters: any = [{ _id: idStr }]
  if (ObjectId.isValid(idStr)) filters.push({ _id: new ObjectId(idStr) })
  const p = await db.collection('posts').findOne({ $or: filters })
  if (!p) return res.status(404).json({ error: 'not found' })
  const origin = `${req.protocol}://${req.get('host')}`
  if (p.mediaUrl && typeof p.mediaUrl === 'string' && !/^https?:\/\//i.test(p.mediaUrl)) {
    const path = p.mediaUrl.startsWith('/') ? p.mediaUrl : `/${p.mediaUrl}`
    return res.json({ ...p, mediaUrl: `${origin}${path}` })
  }
  res.json(p)
})

// unique view tracking: increments views only once per user per post
router.post('/:id/view', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const { id } = req.params
  const idStr = String(id)
  const idFilters: any[] = [{ _id: idStr }]
  if (ObjectId.isValid(idStr)) idFilters.push({ _id: new ObjectId(idStr) })
  const userId = String(req.user.sub)

  const existed = await db.collection('views').findOne({ userId, postId: idStr })
  if (existed) {
    // already viewed, return current count without increment
    const post = await db.collection('posts').findOne({ $or: idFilters }, { projection: { views: 1 } })
    return res.json({ ok: true, viewed: true, views: Number(post?.views || 0) })
  }
  await db.collection('views').insertOne({ userId, postId: idStr, createdAt: new Date() })
  await db.collection('posts').updateOne({ $or: idFilters }, { $inc: { views: 1 } })
  const post = await db.collection('posts').findOne({ $or: idFilters }, { projection: { views: 1 } })
  saveDevData()
  return res.json({ ok: true, viewed: true, views: Number(post?.views || 0) })
})

// update post (owner only)
router.put('/:id', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const { id } = req.params
  const idStr = String(id)
  const idObj = ObjectId.isValid(idStr) ? new ObjectId(idStr) : null

  const updates: any = {}
  if (typeof req.body.title === 'string') updates.title = req.body.title
  if (typeof updates.title === 'string' && updates.title.length > MAX_TITLE_LEN) {
    return res.status(400).json({ error: `title too long (max ${MAX_TITLE_LEN})` })
  }
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

  const filter: any = { ownerId: req.user.sub, $or: [{ _id: idStr }] }
  if (idObj) filter.$or.push({ _id: idObj })
  const result = await db.collection('posts').updateOne(filter, { $set: updates })
  if (result.matchedCount === 0) return res.status(404).json({ error: 'not found' })
  saveDevData()
  return res.status(200).json({ ok: true })
})

// delete post (owner only)
router.delete('/:id', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const { id } = req.params
  const idStr = String(id)
  const idObj = ObjectId.isValid(idStr) ? new ObjectId(idStr) : null
  const filter: any = { ownerId: req.user.sub, $or: [{ _id: idStr }] }
  if (idObj) filter.$or.push({ _id: idObj })
  const result = await db.collection('posts').deleteOne(filter)
  if (result.deletedCount === 0) return res.status(404).json({ error: 'not found' })
  saveDevData()
  return res.status(200).json({ ok: true })
})

export default router
