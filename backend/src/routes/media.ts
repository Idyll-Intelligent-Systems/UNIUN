import { Router } from 'express'
import { authMiddleware } from '../utils/auth'
import crypto from 'crypto'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

const router = Router()

const rootUploadDir = path.resolve(__dirname, '..', 'uploads')
const tmpDir = path.join(rootUploadDir, '.tmp')
function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }
ensureDir(rootUploadDir)
ensureDir(tmpDir)
const upload = multer({ dest: tmpDir })

function ensureDirIfMissing(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }

function pickCategory(mime: string, fallback: string = 'images') {
  if (!mime) return fallback
  if (mime.startsWith('image/')) return 'images'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return fallback
}

// Returns a signed upload URL (stub) — replace with real S3 signer
router.post('/upload-url', authMiddleware, async (req: any, res: any) => {
  const { filename } = req.body
  if (!filename) return res.status(400).json({ error: 'filename required' })

  // S3-style mock signer if AWS env present (placeholder; replace with AWS SDK if desired)
  if (process.env.AWS_S3_BUCKET && process.env.AWS_S3_CDN) {
    const key = `uploads/${Date.now()}-${filename}`
    const uploadUrl = `${process.env.AWS_S3_CDN}/${encodeURIComponent(key)}?X-Amz-Signature=${crypto.randomBytes(16).toString('hex')}`
    const publicUrl = `${process.env.AWS_S3_CDN}/${encodeURIComponent(key)}`
    return res.json({ uploadUrl, publicUrl, key })
  }

  // GCS-style mock signer if GCS env present (placeholder; replace with @google-cloud/storage if desired)
  if (process.env.GCS_BUCKET && process.env.GCS_CDN) {
    const key = `uploads/${Date.now()}-${filename}`
    const uploadUrl = `${process.env.GCS_CDN}/${encodeURIComponent(key)}?X-Goog-Signature=${crypto.randomBytes(16).toString('hex')}`
    const publicUrl = `${process.env.GCS_CDN}/${encodeURIComponent(key)}`
    return res.json({ uploadUrl, publicUrl, key })
  }

  // Default no-op signer for local dev
  res.json({ uploadUrl: `https://example.com/upload/${encodeURIComponent(filename)}`, publicUrl: `https://cdn.example.com/${encodeURIComponent(filename)}` })
})

// Local multipart upload endpoint for dev
router.post('/upload', authMiddleware, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' })
    const cat = pickCategory(req.file.mimetype)
  const dir = path.join(rootUploadDir, cat)
  ensureDirIfMissing(dir)
    const ext = path.extname(req.file.originalname || '') || ''
    const name = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`
    const target = path.join(dir, name)
    fs.renameSync(req.file.path, target)
    const publicUrl = `/uploads/${cat}/${name}`
    return res.json({ ok: true, publicUrl, category: cat, path: publicUrl })
  } catch (e) {
    console.error('upload failed', e)
    return res.status(500).json({ error: 'upload failed' })
  }
})

export default router
