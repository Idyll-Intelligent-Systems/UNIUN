import { Router } from 'express'
import { getMongoClient } from '../mongo'
import { authMiddleware } from '../utils/auth'
import { getNeo4jDriver } from '../neo4j'

const router = Router()

// create post
router.post('/', authMiddleware, async (req: any, res: any) => {
  const client = getMongoClient()
  const db = client.db()
  const { title, mediaType, mediaUrl } = req.body
  const post = { title, mediaType, mediaUrl, ownerId: req.user.sub, likes: 0, replies: 0, reposts: 0, views: 0, createdAt: new Date() }
  const result = await db.collection('posts').insertOne(post)

  // Sync minimal post node to Neo4j
  try {
    const driver = getNeo4jDriver()
    const session = driver.session()
    await session.executeWrite((tx: any) => tx.run('MERGE (p:Post {id:$id}) SET p.title=$title, p.createdAt=$createdAt', { id: result.insertedId.toString(), title, createdAt: post.createdAt.toISOString() }))
    await session.close()
  } catch (err) {
    console.warn('Could not sync post to Neo4j', err)
  }

  res.json({ id: result.insertedId })
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
  res.json(items)
})

export default router
