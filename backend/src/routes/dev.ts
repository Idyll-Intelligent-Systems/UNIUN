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
    { username: 'PAZE', bio: 'Prioritizing relaxation since 2025.', avatar: '/avatars/paze.png' },
    { username: 'Veee', bio: 'Vibes, velocity, and versions.', avatar: '/avatars/veee.png' },
    { username: 'MSSM', bio: 'Minimal state, maximum momentum.', avatar: '/avatars/mssm.png' },
    { username: 'PrDeep', bio: 'Went so deep the stack overflowed.', avatar: '/avatars/prdeep.png' },
    { username: 'SHAVAITE', bio: 'Refactors coffee into code.', avatar: '/avatars/shaivate.png' },
    { username: 'MITRA', bio: 'Mentors code and caffeine.', avatar: '/avatars/mitra.png' },
  ]
  for (const b of bots) {
    if (!mem.users.find(u => u.username === b.username)) {
      mem.users.push({ _id: newId(), username: b.username, password: '$2a$10$8e3H1vK0b8l6m6m6m6m6.u0vJxXo1KjvKqGm1dQw9G7nKQy2p2Q2', createdAt: now } as any)
    }
  }
  // Sample local assets under /uploads (mounted into backend container). If some paths don't exist, frontend will still show placeholders.
  const img1 = '/uploads/images/1759689109102-06efaa04ce.jpeg'
  const img2 = '/uploads/images/1759845725777-1803cd2686.jpeg'
  const vid1 = '/uploads/video/1759847815464-483f0d6e2c.MP4'
  const posts = [
    { _id: newId(), title: 'Welcome to UNIUN', mediaType: 'image', mediaUrl: img1, ownerId, likes: 3, replies: 0, reposts: 1, views: 10, createdAt: now },
    { _id: newId(), title: 'Second post (video demo)', mediaType: 'video', mediaUrl: vid1, ownerId, likes: 1, replies: 0, reposts: 0, views: 5, createdAt: now },
    { _id: newId(), title: 'PAZE: “Budgeted my energy; budget was zero.”', mediaType: 'image', mediaUrl: img2, ownerId: mem.users.find(u=>u.username==='PAZE')?._id || ownerId, likes: 2, replies: 0, reposts: 0, views: 12, createdAt: now },
    { _id: newId(), title: 'Veee: “Vroom vroom into prod.”', mediaType: 'image', mediaUrl: img1, ownerId: mem.users.find(u=>u.username==='Veee')?._id || ownerId, likes: 1, replies: 0, reposts: 0, views: 8, createdAt: now },
    { _id: newId(), title: 'MSSM: “Minimal bugs, maximal shipping.”', mediaType: 'image', mediaUrl: img2, ownerId: mem.users.find(u=>u.username==='MSSM')?._id || ownerId, likes: 4, replies: 0, reposts: 1, views: 15, createdAt: now },
    { _id: newId(), title: 'PrDeep: “Edge case discovered: reality.”', mediaType: 'image', mediaUrl: img1, ownerId: mem.users.find(u=>u.username==='PrDeep')?._id || ownerId, likes: 5, replies: 1, reposts: 1, views: 20, createdAt: now },
    { _id: newId(), title: 'SHAVAITE: “Coffee.compile() success.”', mediaType: 'image', mediaUrl: img2, ownerId: mem.users.find(u=>u.username==='SHAVAITE')?._id || ownerId, likes: 3, replies: 1, reposts: 0, views: 14, createdAt: now },
    { _id: newId(), title: 'MITRA: “Mentored a bot today.”', mediaType: 'image', mediaUrl: img1, ownerId: mem.users.find(u=>u.username==='MITRA')?._id || ownerId, likes: 2, replies: 0, reposts: 0, views: 9, createdAt: now },
  ]
  mem.posts.unshift(...posts)
  // Optionally create some follower edges among bots so messages list has data after follow
  const paze = mem.users.find(u=>u.username==='PAZE')?._id
  const veee = mem.users.find(u=>u.username==='Veee')?._id
  const prd = mem.users.find(u=>u.username==='PrDeep')?._id
  if (paze && prd) mem.followers.push({ followerId: String(paze), followeeId: String(prd), createdAt: now })
  if (veee && paze) mem.followers.push({ followerId: String(veee), followeeId: String(paze), createdAt: now })
  saveDevData()
  res.json({ inserted: posts.length })
})

export default router
