import fs from 'fs'
import path from 'path'
import { mem } from './memory'

const storagePath = path.resolve(__dirname, '..', '.devdata.json')

export function loadDevData() {
  try {
    if (!fs.existsSync(storagePath)) return false
    const raw = fs.readFileSync(storagePath, 'utf8')
    const data = JSON.parse(raw)
    if (data.users && Array.isArray(data.users)) mem.users = data.users
    if (data.posts && Array.isArray(data.posts)) mem.posts = data.posts
    if (data.bookmarks && Array.isArray(data.bookmarks)) mem.bookmarks = data.bookmarks
  if (data.reposts && Array.isArray(data.reposts)) mem.reposts = data.reposts
  if (data.replies && Array.isArray(data.replies)) mem.replies = data.replies
    if (data.carts && typeof data.carts === 'object') {
      const m = new Map<string, any>()
      for (const k of Object.keys(data.carts)) m.set(k, data.carts[k])
      mem.carts = m as any
    }
    return true
  } catch (e) {
    console.warn('Dev data load failed', e)
    return false
  }
}

export function saveDevData() {
  try {
    const obj = {
      users: mem.users,
      posts: mem.posts,
      bookmarks: mem.bookmarks,
      reposts: mem.reposts,
      replies: mem.replies,
      carts: Object.fromEntries(mem.carts.entries()),
    }
    fs.writeFileSync(storagePath, JSON.stringify(obj, null, 2), 'utf8')
    return true
  } catch (e) {
    console.warn('Dev data save failed', e)
    return false
  }
}
