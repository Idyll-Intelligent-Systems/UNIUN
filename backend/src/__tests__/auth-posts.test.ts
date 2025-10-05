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

  // fallback to provided MONGO_URI (e.g., CI provides a mongo service) or skip
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

test('register -> login -> create post -> list posts', async () => {
  if (skipTests) {
    console.warn('Skipping auth-posts integration test because no MongoDB available')
    return
  }

  const agent = request(app)
  // register
  const reg = await agent.post('/api/auth/register').send({ username: 'bob', password: 'pass' })
  expect(reg.status).toBe(200)

  // login
  const login = await agent.post('/api/auth/login').send({ username: 'bob', password: 'pass' })
  expect(login.status).toBe(200)
  const token = login.body.token
  expect(token).toBeTruthy()

  // create post
  const post = await agent.post('/api/posts').set('Authorization', `Bearer ${token}`).send({ title: 'Hi', mediaType: 'image' })
  expect(post.status).toBe(200)

  // list posts
  const list = await agent.get('/api/posts')
  expect(list.status).toBe(200)
  expect(Array.isArray(list.body)).toBe(true)
  expect(list.body.length).toBeGreaterThanOrEqual(1)
})
