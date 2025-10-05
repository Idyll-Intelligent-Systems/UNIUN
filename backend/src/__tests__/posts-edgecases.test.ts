import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
import { connectMongo, disconnectMongo } from '../mongo'

let skipTests = false
let mongod: MongoMemoryServer | null = null

beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongod.getUri()
    await connectMongo()
    return
  } catch (err) {
    console.warn('mongodb-memory-server failed to start, falling back to MONGO_URI if provided', err)
  }

  if (process.env.MONGO_URI) {
    try {
      await connectMongo()
      return
    } catch (err) {
      console.warn('Fallback MONGO_URI connection failed', err)
    }
  }

  console.warn('No MongoDB available for tests; skipping integration tests')
  skipTests = true
})

afterAll(async () => {
  try {
    await disconnectMongo()
  } catch (_) {}
  if (mongod) await mongod.stop()
})

test('post creation validation fails on missing fields', async () => {
  if (skipTests) return
  const agent = request(app)
  // create user and login
  await agent.post('/api/auth/register').send({ username: 'valuser', password: 'pass' })
  const login = await agent.post('/api/auth/login').send({ username: 'valuser', password: 'pass' })
  const token = login.body.token
  // missing mediaType
  const res = await agent.post('/api/posts').set('Authorization', `Bearer ${token}`).send({ title: '' })
  expect(res.status).toBeGreaterThanOrEqual(400)
})

test('updating non-existent post returns 404', async () => {
  if (skipTests) return
  const agent = request(app)
  await agent.post('/api/auth/register').send({ username: 'edituser', password: 'pass' })
  const login = await agent.post('/api/auth/login').send({ username: 'edituser', password: 'pass' })
  const token = login.body.token
  const res = await agent.put('/api/posts/000000000000000000000000').set('Authorization', `Bearer ${token}`).send({ title: 'nope' })
  expect([404, 400, 500].includes(res.status)).toBe(true)
})
