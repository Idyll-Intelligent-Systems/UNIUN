// Simple in-memory fallback store for local dev when Mongo is unavailable
// Not for production use. Data resets on server restart.

export type MemUser = { _id: string; username: string; password: string; createdAt: Date }
export type MemPost = { _id: string; title: string; mediaType: string; mediaUrl?: string; ownerId: string; likes: number; replies: number; reposts: number; views: number; createdAt: Date }
export type MemCart = { userId: string; items: { itemId: string; price: number }[] }
export type MemBookmark = { userId: string; postId: string; createdAt: Date }
export type MemRepost = { userId: string; postId: string; createdAt: Date }
export type MemReply = { userId: string; postId: string; text: string; createdAt: Date }

export const mem = {
  users: [] as MemUser[],
  posts: [] as MemPost[],
  carts: new Map<string, MemCart>(),
  bookmarks: [] as MemBookmark[],
  reposts: [] as MemRepost[],
  replies: [] as MemReply[],
}

// Poor-man's ObjectId-like generator (24 hex chars)
export function newId() {
  const bytes = Array.from({ length: 12 }, () => Math.floor(Math.random() * 256))
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
}
