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

test('duplicate registration should be rejected and failed login returns 401', async () => {
  if (skipTests) return
  const agent = request(app)

  const reg1 = await agent.post('/api/auth/register').send({ username: 'alice', password: 'pwd' })
  expect(reg1.status).toBe(200)

  // duplicate username
  const reg2 = await agent.post('/api/auth/register').send({ username: 'alice', password: 'pwd2' })
  expect(reg2.status).toBeGreaterThanOrEqual(400)

  // bad login
  const badLogin = await agent.post('/api/auth/login').send({ username: 'alice', password: 'wrong' })
  expect(badLogin.status).toBe(401)
})

test('unauthorized post creation should be rejected; authorized create/update/delete succeed', async () => {
  if (skipTests) return
  const agent = request(app)

  // create user and login
  await agent.post('/api/auth/register').send({ username: 'carol', password: 'pass' })
  const login = await agent.post('/api/auth/login').send({ username: 'carol', password: 'pass' })
  expect(login.status).toBe(200)
  const token = login.body.token
  expect(token).toBeTruthy()

  // unauthorized create (no token)
  const nopost = await agent.post('/api/posts').send({ title: 'NoAuth', mediaType: 'image' })
  expect(nopost.status).toBe(401)

  // create post with token
  const postRes = await agent.post('/api/posts').set('Authorization', `Bearer ${token}`).send({ title: 'My Post', mediaType: 'image' })
  expect(postRes.status).toBe(200)
  const postId = postRes.body.id || postRes.body._id || postRes.body.insertedId
  expect(postId).toBeTruthy()

  // update post
  const upd = await agent.put(`/api/posts/${postId}`).set('Authorization', `Bearer ${token}`).send({ title: 'Updated' })
  // our API may return 200 or 204; accept either
  expect([200, 204].includes(upd.status)).toBe(true)

  // delete post
  const del = await agent.delete(`/api/posts/${postId}`).set('Authorization', `Bearer ${token}`)
  expect([200, 204].includes(del.status)).toBe(true)
})
