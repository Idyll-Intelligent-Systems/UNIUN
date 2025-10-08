import { MongoClient } from 'mongodb';
import { mem } from './memory'

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uniun';
let client: MongoClient | null = null;
let connected = false;

export async function connectMongo() {
  const timeout = Number(process.env.MONGO_TIMEOUT_MS || 2000)
  const tls = process.env.MONGO_TLS === 'true'
  const caFile = process.env.MONGO_CA_FILE
  const c = new MongoClient(uri, {
    serverSelectionTimeoutMS: timeout,
    tls,
    tlsCAFile: caFile,
    // For SRV connection strings, these will be ignored if not applicable
  } as any);
  try {
    await c.connect();
    client = c;
    connected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    // Ensure we fall back to memory shim
    connected = false;
  try { await c.close(); } catch (e) { /* ignore close errors */ }
    client = null;
    throw err;
  }
}

export function getMongoClient() {
  // If we don't have an active connection, serve the in-memory shim
  if (!client || !connected) {
    // Return a shim that mimics the minimal API we use, backed by memory.
    return {
      db() {
        return {
          collection(name: string) {
            return {
              async findOne(query: any) {
                if (name === 'users') return mem.users.find(u => u.username === query.username) || null
                if (name === 'carts') return mem.carts.get(query.userId) || null
                return null
              },
              async insertOne(doc: any) {
                if (name === 'users') { mem.users.push(doc); return { insertedId: doc._id || doc.id || doc.username } }
                if (name === 'posts') { mem.posts.unshift(doc); return { insertedId: doc._id } }
                return { insertedId: null }
              },
              async updateOne(filter: any, update: any) {
                if (name === 'posts' && update?.$inc?.likes) {
                  const p = mem.posts.find(p => p._id === filter._id?.toString?.() || p._id === filter._id)
                  if (p) p.likes += update.$inc.likes
                  return { matchedCount: p ? 1 : 0, modifiedCount: p ? 1 : 0 }
                }
                if (name === 'posts' && update?.$inc?.reposts) {
                  const p = mem.posts.find(p => p._id === filter._id?.toString?.() || p._id === filter._id)
                  if (p) p.reposts += update.$inc.reposts
                  return { matchedCount: p ? 1 : 0, modifiedCount: p ? 1 : 0 }
                }
                if (name === 'bookmarks' && update?.$set) {
                  const { userId, postId } = update.$set
                  const existing = mem.bookmarks.find(b => b.userId === userId && b.postId === postId)
                  if (!existing) mem.bookmarks.push({ userId, postId, createdAt: new Date() })
                  return { upsertedId: null, matchedCount: 1, modifiedCount: 1 }
                }
                if (name === 'carts' && update?.$push?.items) {
                  const userId = filter.userId
                  const cart = mem.carts.get(userId) || { userId, items: [] as { itemId: string; price: number }[] }
                  cart.items.push({ itemId: String(update.$push.items.itemId), price: Number(update.$push.items.price || 0) })
                  mem.carts.set(userId, cart)
                  return { upsertedId: null, matchedCount: 1, modifiedCount: 1 }
                }
                if (name === 'posts' && update?.$set) {
                  const p = mem.posts.find(p => p._id === (filter._id?.toString?.() || filter._id) && p.ownerId === filter.ownerId)
                  if (!p) return { matchedCount: 0, modifiedCount: 0 }
                  Object.assign(p, update.$set)
                  return { matchedCount: 1, modifiedCount: 1 }
                }
                return { matchedCount: 0, modifiedCount: 0 }
              },
              async deleteOne(filter: any) {
                if (name === 'posts') {
                  const idx = mem.posts.findIndex(p => p._id === (filter._id?.toString?.() || filter._id) && p.ownerId === filter.ownerId)
                  if (idx >= 0) { mem.posts.splice(idx, 1); return { deletedCount: 1 } }
                  return { deletedCount: 0 }
                }
                return { deletedCount: 0 }
              },
              find() {
                if (name === 'posts') {
                  return {
                    sort() { return this },
                    limit() { return this },
                    async toArray() { return mem.posts },
                  }
                }
                return { sort() { return this }, limit() { return this }, async toArray() { return [] } }
              },
            }
          }
        }
      }
    } as any
  }
  return client;
}

export async function disconnectMongo() {
  if (client) {
    await client.close();
    client = null
  }
  connected = false;
}
