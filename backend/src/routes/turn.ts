import { Router } from 'express'

const router = Router()

// Return TURN server config (if configured) to clients. This is intentionally
// a simple endpoint; in production you may want to protect it and rotate credentials.
router.get('/', async (req, res) => {
  const turnUrl = process.env.TURN_URL || null
  const turnUser = process.env.TURN_USERNAME || null
  const turnCred = process.env.TURN_CREDENTIAL || null
  const stun = process.env.STUN_URL || null
  res.json({ stun, turn: turnUrl ? { urls: turnUrl, username: turnUser, credential: turnCred } : null })
})

export default router
