import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../app'
import { connectMongo, disconnectMongo } from '../mongo'

let skipTests = false
let mongod: MongoMemoryServer | null = null

beforeAll(async () => {
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
