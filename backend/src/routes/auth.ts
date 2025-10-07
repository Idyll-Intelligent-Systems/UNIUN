import { Router } from 'express'
import { getMongoClient } from '../mongo'
import { newId } from '../memory'
import { saveDevData } from '../dev-storage'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

const router = Router()

router.post('/register', async (req, res) => {
  const client = getMongoClient()
  const db = client.db()
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username & password required' })
  const existing = await db.collection('users').findOne({ username })
  if (existing) return res.status(409).json({ error: 'username exists' })
  const hash = await bcrypt.hash(password, 10)
  const user = { _id: newId(), username, password: hash, createdAt: new Date() }
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
// Google Sign-In: exchange ID token for app JWT
router.post('/google', async (req, res) => {
  const { idToken } = req.body as any
  if (!idToken) return res.status(400).json({ error: 'idToken required' })

  const client = getMongoClient()
  const db = client.db()

  try {
    const aud = process.env.GOOGLE_CLIENT_ID
    const oauth = new OAuth2Client(aud)
    const ticket = await oauth.verifyIdToken({ idToken, audience: aud })
    const payload = ticket.getPayload()
    if (!payload) return res.status(401).json({ error: 'invalid token' })
    const sub = payload.sub as string
    const email = payload.email as string | undefined
    const name = (payload.name as string | undefined) || (email ? email.split('@')[0] : `user_${sub.slice(-6)}`)

    // find or create user
    let user: any = await db.collection('users').findOne({ oauth: { provider: 'google', sub } } as any)
    if (!user) {
      user = { _id: newId(), username: name, oauth: { provider: 'google', sub, email }, createdAt: new Date() }
      await db.collection('users').insertOne(user)
      saveDevData()
    }
    const token = jwt.sign({ sub: user._id.toString(), username: user.username }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })
    res.json({ token })
  } catch (e) {
    console.error('google auth failed', e)
    return res.status(401).json({ error: 'google verification failed' })
  }
})
