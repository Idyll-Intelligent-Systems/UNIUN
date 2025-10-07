import { Router } from 'express'
import { authMiddleware } from '../utils/auth'
import { mem } from '../memory'
import { getMongoClient } from '../mongo'
import fs from 'fs'
import path from 'path'

const router = Router()

// Load avatar mapping (optional)
let avatarMap: Record<string, string> = {}
try {
  const p = path.resolve(__dirname, '..', '..', 'avatars', 'README.json')
  avatarMap = JSON.parse(fs.readFileSync(p, 'utf-8'))
} catch (e) { /* ignore load avatar map errors */ }

function getAvatarFor(username?: string) {
  if (!username) return null
  if (avatarMap[username]) return avatarMap[username]
  // fallback convention: /avatars/<lowercased>.png (may 404 if not present)
  return `/avatars/${username.toLowerCase()}.png`
}

// List users (basic)
router.get('/', async (req: any, res: any) => {
  try {
    const db = getMongoClient().db()
    const docs = await db.collection('users').find({}, { projection: { password: 0 } } as any).limit(50).toArray()
    return res.json(docs.map((u:any)=> ({ id: u._id, _id: u._id, username: u.username, avatarUrl: getAvatarFor(u.username) })))
  } catch (e) {
    // fallback to memory (exclude password)
    return res.json(mem.users.map(u => ({ id: u._id, _id: u._id, username: u.username, createdAt: u.createdAt, avatarUrl: getAvatarFor(u.username) })))
  }
})

// Lookup minimal profile for a set of user IDs
router.get('/lookup', async (req: any, res: any) => {
  const idsRaw = (req.query.ids || '').toString()
  const ids = idsRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
  if (ids.length === 0) return res.json([])
  const out: any[] = []
  try {
    const db = getMongoClient().db()
    const docs = await db.collection('users').find({ _id: { $in: ids as any } }).project({ password: 0 }).toArray()
    for (const u of docs) out.push({ id: u._id, _id: u._id, username: (u as any).username, avatarUrl: getAvatarFor((u as any).username) })
  } catch (e) { /* ignore DB lookup */ }
  // include any from memory not found above
  for (const id of ids) {
    if (!out.find(p => String(p.id) === String(id))) {
      const m = mem.users.find(u => String(u._id) === String(id))
      if (m) out.push({ id: m._id, _id: m._id, username: m.username, avatarUrl: getAvatarFor(m.username) })
    }
  }
  res.json(out)
})

// Current user profile (id, username)
router.get('/me', authMiddleware, async (req: any, res: any) => {
  const userId = req.user.sub
  // try to get from mem first
  const m = mem.users.find(u => String(u._id) === String(userId))
  if (m) return res.json({ id: m._id, username: m.username })
  // try DB
  try {
    const db = getMongoClient().db()
    const user = await db.collection('users').findOne({ _id: (userId as any) })
    if (user) return res.json({ id: user._id, username: (user as any).username })
  } catch (e) {
    // ignore
  }
  return res.status(404).json({ error: 'not found' })
})

// Follow a user
router.post('/follow/:userId', authMiddleware, async (req: any, res: any) => {
  const followerId = String(req.user.sub)
  const followeeId = String(req.params.userId)
  if (followerId === followeeId) return res.status(400).json({ error: 'cannot follow self' })

  // memory record (avoid duplicates)
  const already = mem.followers.find((f: any) => f.followerId === followerId && f.followeeId === followeeId)
  if (!already) mem.followers.push({ followerId, followeeId, createdAt: new Date() })

  // DB best-effort
  try {
    const db = getMongoClient().db()
    await db.collection('follows').updateOne({ followerId, followeeId }, { $set: { followerId, followeeId, createdAt: new Date() } }, { upsert: true })
  } catch (e) { /* ignore */ }

  res.json({ ok: true })
})

// Unfollow a user
router.post('/unfollow/:userId', authMiddleware, async (req: any, res: any) => {
  const followerId = String(req.user.sub)
  const followeeId = String(req.params.userId)
  const idx = mem.followers.findIndex((f: any) => f.followerId === followerId && f.followeeId === followeeId)
  if (idx >= 0) mem.followers.splice(idx, 1)
  try {
    const db = getMongoClient().db()
    await db.collection('follows').deleteOne({ followerId, followeeId })
  } catch (e) { /* ignore */ }
  res.json({ ok: true })
})

// List followers
router.get('/:id/followers', async (req: any, res: any) => {
  const id = String(req.params.id)
  const list = mem.followers.filter((f: any) => f.followeeId === id)
  if (String(req.query.expand) === '1' || String(req.query.expand).toLowerCase() === 'true') {
    const ids = Array.from(new Set(list.map((f:any)=> f.followerId)))
    const profiles: any[] = []
    try {
      const db = getMongoClient().db()
      const docs = await db.collection('users').find({ _id: { $in: ids as any } }).project({ password: 0 }).toArray()
      for (const u of docs) profiles.push({ id: u._id, username: (u as any).username, avatarUrl: getAvatarFor((u as any).username) })
  } catch (e) { /* ignore DB expand */ }
    for (const uid of ids) {
      if (!profiles.find(p => String(p.id) === String(uid))) {
        const m = mem.users.find(u => String(u._id) === String(uid))
        if (m) profiles.push({ id: m._id, username: m.username, avatarUrl: getAvatarFor(m.username) })
      }
    }
    return res.json(profiles)
  }
  res.json(list)
})

// List following
router.get('/:id/following', async (req: any, res: any) => {
  const id = String(req.params.id)
  const list = mem.followers.filter((f: any) => f.followerId === id)
  if (String(req.query.expand) === '1' || String(req.query.expand).toLowerCase() === 'true') {
    const ids = Array.from(new Set(list.map((f:any)=> f.followeeId)))
    const profiles: any[] = []
    try {
      const db = getMongoClient().db()
      const docs = await db.collection('users').find({ _id: { $in: ids as any } }).project({ password: 0 }).toArray()
      for (const u of docs) profiles.push({ id: u._id, username: (u as any).username, avatarUrl: getAvatarFor((u as any).username) })
  } catch (e) { /* ignore DB expand */ }
    for (const uid of ids) {
      if (!profiles.find(p => String(p.id) === String(uid))) {
        const m = mem.users.find(u => String(u._id) === String(uid))
        if (m) profiles.push({ id: m._id, username: m.username, avatarUrl: getAvatarFor(m.username) })
      }
    }
    return res.json(profiles)
  }
  res.json(list)
})

export default router
