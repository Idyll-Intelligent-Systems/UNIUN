import { Router } from 'express'
import { getMongoClient } from '../mongo'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/register', async (req, res) => {
  const client = getMongoClient()
  const db = client.db()
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username & password required' })
  const existing = await db.collection('users').findOne({ username })
  if (existing) return res.status(409).json({ error: 'username exists' })
  const hash = await bcrypt.hash(password, 10)
  const result = await db.collection('users').insertOne({ username, password: hash, createdAt: new Date() })
  res.json({ id: result.insertedId })
})

router.post('/login', async (req, res) => {
  const client = getMongoClient()
  const db = client.db()
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username & password required' })
  const user = await db.collection('users').findOne({ username })
  if (!user) return res.status(401).json({ error: 'invalid credentials' })
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ error: 'invalid credentials' })
  const token = jwt.sign({ sub: user._id.toString(), username }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })
  res.json({ token })
})

export default router
