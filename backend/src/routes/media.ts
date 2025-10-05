import { Router } from 'express'
import { authMiddleware } from '../utils/auth'

const router = Router()

// Returns a signed upload URL (stub) — replace with real S3 signer
router.post('/upload-url', authMiddleware, async (req: any, res: any) => {
  const { filename, contentType } = req.body
  if (!filename) return res.status(400).json({ error: 'filename required' })
  // In prod generate a presigned URL from S3/GCS
  res.json({ uploadUrl: `https://example.com/upload/${encodeURIComponent(filename)}`, publicUrl: `https://cdn.example.com/${encodeURIComponent(filename)}` })
})

export default router
