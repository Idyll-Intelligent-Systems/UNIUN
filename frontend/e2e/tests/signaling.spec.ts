import { test, expect } from '@playwright/test'
import WebSocket from 'ws'

const WS_BASE = process.env.E2E_WS_BASE || 'ws://localhost:4000/ws'

test('signaling: peers can join room and exchange messages', async () => {
  // create two ws clients
  const a = new WebSocket(WS_BASE)
  const b = new WebSocket(WS_BASE)

  await new Promise((resolve) => { a.on('open', resolve) })
  await new Promise((resolve) => { b.on('open', resolve) })

  const peerA = 'a-' + Math.random().toString(36).slice(2,6)
  const peerB = 'b-' + Math.random().toString(36).slice(2,6)
  const room = 'e2e-room-' + Math.random().toString(36).slice(2,6)

  const messagesA: any[] = []
  const messagesB: any[] = []
  a.on('message', (m: any) => messagesA.push(JSON.parse(m.toString())))
  b.on('message', (m: any) => messagesB.push(JSON.parse(m.toString())))

  // join both
  a.send(JSON.stringify({ type: 'join', room, peerId: peerA }))
  b.send(JSON.stringify({ type: 'join', room, peerId: peerB }))

  // wait briefly for the join ack / peer-joined events
  await new Promise(r => setTimeout(r, 300))

  // a should have an ack and peer-joined for b
  expect(messagesA.find(m => m.type === 'join:ack')).toBeTruthy()
  expect(messagesA.find(m => m.type === 'peer-joined')).toBeTruthy()

  // send a directed message from A to B
  a.send(JSON.stringify({ type: 'message', text: 'hello-b', targetPeer: peerB }))
  await new Promise(r => setTimeout(r, 200))
  expect(messagesB.find(m => m.text === 'hello-b')).toBeTruthy()

  a.close(); b.close()
})
