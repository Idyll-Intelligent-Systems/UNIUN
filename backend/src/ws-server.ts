import { WebSocketServer } from 'ws'

type ClientMeta = {
  ws: any
  room?: string
  peerId?: string
}

export function startWSServer(server: any) {
  const wss = new WebSocketServer({ noServer: true })
  // store clients with metadata
  const clients = new Set<ClientMeta>()
  // rooms map: room -> Set<ClientMeta>
  const rooms = new Map<string, Set<ClientMeta>>()

  server.on('upgrade', (req: any, socket: any, head: any) => {
    if (req.url && req.url.startsWith('/ws')) {
      wss.handleUpgrade(req, socket, head, (ws: any) => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', (ws: any) => {
    const meta: ClientMeta = { ws }
    clients.add(meta)

    ws.on('message', (raw: any) => {
      let msg: any
      try { msg = JSON.parse(raw.toString()) } catch { return }

      // join message to bind peerId and room
      if (msg.type === 'join') {
        const room = msg.room || 'global'
        meta.room = room
        // assign a stable peerId if not provided
        meta.peerId = msg.peerId || ('peer-' + Math.random().toString(36).slice(2, 9))

        // add to room map
        if (!rooms.has(room)) rooms.set(room, new Set())
        rooms.get(room)!.add(meta)

        // prepare members list
        const members = Array.from(rooms.get(room)!).map(c => c.peerId).filter(Boolean)

        // ack back to the joining client with assigned id and current members
        try { meta.ws.send(JSON.stringify({ type: 'join:ack', peerId: meta.peerId, room, members })) } catch {}

        // notify other members in the room about the join
        for (const c of rooms.get(room)!) {
          if (c !== meta && c.ws.readyState === c.ws.OPEN) {
            try { c.ws.send(JSON.stringify({ type: 'peer-joined', peerId: meta.peerId })) } catch {}
          }
        }
        return
      }

      // signaling messages: offer/answer/ice
      if (['offer', 'answer', 'ice', 'message'].includes(msg.type)) {
        // if targetPeer provided, deliver only to that peer in same room
        if (msg.targetPeer) {
          // send to specific peer within the same room
          const room = meta.room
          const set = room ? rooms.get(room) : clients
          for (const c of (set || clients)) {
            if (c.peerId === msg.targetPeer && c.ws.readyState === c.ws.OPEN) {
              try { c.ws.send(JSON.stringify({ ...msg, from: meta.peerId })) } catch {}
            }
          }
          return
        }

        // otherwise broadcast within the same room (or to all if no room)
        const set = meta.room ? rooms.get(meta.room) : clients
        for (const c of (set || clients)) {
          if (c === meta) continue
          if (c.ws.readyState !== c.ws.OPEN) continue
          try { c.ws.send(JSON.stringify({ ...msg, from: meta.peerId })) } catch {}
        }
      }
    })

    ws.on('close', () => {
      clients.delete(meta)
      if (meta.room && rooms.has(meta.room)) {
        rooms.get(meta.room)!.delete(meta)
        if (rooms.get(meta.room)!.size === 0) rooms.delete(meta.room)
      }
    })
  })

  console.log('WebSocket signaling server started with room/peer support')
}
