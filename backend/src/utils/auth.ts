import jwt from 'jsonwebtoken'

export function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'missing auth' })
  const parts = header.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret') as any
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
}
