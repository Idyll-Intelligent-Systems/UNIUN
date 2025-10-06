import { Router } from 'express'
import { mem, newId } from '../memory'
import { saveDevData } from '../dev-storage'

const router = Router()

router.post('/clear', (req, res) => {
  mem.users = []
  mem.posts = []
  mem.bookmarks = []
  mem.reposts = []
  mem.replies = []
  mem.carts.clear()
  saveDevData()
  res.json({ ok: true })
})

router.post('/seed', (req, res) => {
  const now = new Date()
  const ownerId = 'seed-user'
  const bots = [
    { username: 'PAZE', bio: "Prioritizing relaxation since 2025.", avatar: '/avatars/paze.png' },
    { username: 'PrDeep', bio: "Went so deep the stack overflowed.", avatar: '/avatars/prdeep.png' },
    { username: 'SHAIVATE', bio: "Refactors coffee into code.", avatar: '/avatars/shaivate.png' },
    { username: 'MITRA', bio: "Mentors code and caffeine.", avatar: '/avatars/mitra.png' },
    { username: 'MACRO', bio: "Automates breakfast; debugs toast.", avatar: '/avatars/macro.png' },
    { username: 'RB', bio: "Rebuilds builds to build character.", avatar: '/avatars/rb.png' },
  ]
  for (const b of bots) {
    if (!mem.users.find(u => u.username === b.username)) {
      mem.users.push({ _id: newId(), username: b.username, password: '$2a$10$8e3H1vK0b8l6m6m6m6m6.u0vJxXo1KjvKqGm1dQw9G7nKQy2p2Q2', createdAt: now } as any)
    }
  }
  const posts = [
    { _id: newId(), title: 'Welcome to UNIUN', mediaType: 'image', ownerId, likes: 3, replies: 0, reposts: 1, views: 10, createdAt: now },
    { _id: newId(), title: 'Second post', mediaType: 'video', ownerId, likes: 1, replies: 0, reposts: 0, views: 5, createdAt: now },
    { _id: newId(), title: 'PAZE: “Budgeted my energy; budget was zero.”', mediaType: 'image', ownerId: mem.users.find(u=>u.username==='PAZE')?._id || ownerId, likes: 2, replies: 0, reposts: 0, views: 12, createdAt: now },
    { _id: newId(), title: 'PrDeep: “Edge case discovered: reality.”', mediaType: 'image', ownerId: mem.users.find(u=>u.username==='PrDeep')?._id || ownerId, likes: 5, replies: 1, reposts: 1, views: 20, createdAt: now },
  ]
  mem.posts.unshift(...posts)
  saveDevData()
  res.json({ inserted: posts.length })
})

export default router
