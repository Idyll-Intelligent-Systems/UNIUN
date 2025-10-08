import { Router } from 'express'
import { getMongoClient } from '../mongo'
import { newId } from '../memory'
import { saveDevData } from '../dev-storage'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
// Google Sign-In temporarily disabled; keep import commented to avoid unused dep.
// import { OAuth2Client } from 'google-auth-library'

const router = Router()

router.post('/register', async (req, res) => {
  const client = getMongoClient()
  const db = client.db()
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username & password required' })
  const existing = await db.collection('users').findOne({ username })
  if (existing) return res.status(409).json({ error: 'username exists' })
  const hash = await bcrypt.hash(password, 10)
  const user = { _id: newId(), username, password: hash, createdAt: new Date(), avatarUrl: '/avatars/veee.png' }
  const result = await db.collection('users').insertOne(user)
  saveDevData()
  // For memory shim, insertedId may not exist; return user._id instead
  res.json({ id: (result as any).insertedId || user._id })
})

router.post('/login', async (req, res) => {
  const client = getMongoClient()
  const db = client.db()
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username & password required' })
  const user: any = await db.collection('users').findOne({ username })
  if (!user) return res.status(401).json({ error: 'invalid credentials' })
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ error: 'invalid credentials' })
  const token = jwt.sign({ sub: user._id.toString(), username }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })
  res.json({ token })
})

export default router
// Google Sign-In endpoint is disabled for now. To restore, re-enable the route below.
// router.post('/google', ...)
