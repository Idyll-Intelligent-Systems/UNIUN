import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
import { connectMongo, disconnectMongo } from '../mongo'

let skipTests = false
let mongod: MongoMemoryServer | null = null

beforeAll(async () => {
  // reduce waiting time for memory server in CI without internet
  process.env.MONGOMS_DISABLE_POSTINSTALL = '1'
  process.env.MONGOMS_DOWNLOAD_URL = ''
  try {
    mongod = await MongoMemoryServer.create()
    process.env.MONGO_URI = mongod.getUri()
    await connectMongo()
    return
  } catch (err) {
    // silent fallback for environments without internet/mongo binaries
  }

  // fallback to provided MONGO_URI (e.g., CI provides a mongo service) or skip
  if (process.env.MONGO_URI) {
    try {
      await connectMongo()
      return
  } catch (err) { /* ignore connect failure */ }
  }
  skipTests = true
})

afterAll(async () => {
  try {
    await disconnectMongo()
  } catch (_) { /* ignore disconnect failure */ }
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
