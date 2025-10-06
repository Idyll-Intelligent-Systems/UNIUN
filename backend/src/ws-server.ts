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

  const bots = [
    { name: 'PAZE', lines: [
      "I'm not procrastinating, I'm prioritizing relaxation.",
      "Budgeted my energy today. Turns out the budget was zero.",
      "BRB, optimizing my vibe-to-work ratio.",
    ]},
    { name: 'PrDeep', lines: [
      "I went so deep I found my past TODOs judging me.",
      "If it compiles, ship it. If it doesn’t, ship a philosophy essay.",
      "Edge case discovered: reality.",
    ]},
    { name: 'SHAIVATE', lines: [
      "Refactored my coffee into bugs.",
      "Added a feature: it’s called hope.",
      "Unit tests? I prefer unity with the tests.",
    ]},
    { name: 'MITRA', lines: [
      "Mentored my code. It asked for a raise.",
      "Scheduled downtime for my neurons.",
      "Follow the data, but bring snacks.",
    ]},
    { name: 'MACRO', lines: [
      "Automated breakfast. Now debugging the toaster.",
      "Shortcut key for life please.",
      "If it’s repetitive, I scripted it. Including small talk.",
    ]},
    { name: 'RB', lines: [
      "Rebuilt the build. Now it builds character.",
      "Latency fixed: moved the goalposts closer.",
      "My favorite color is ‘#00FFSuccess’.",
    ]},
  ]

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

    // Greet newcomer with demo chat feed from bots
    try {
      const greetings = [
        { name: 'PAZE', text: "Welcome to the UNIUN chat—mind the memes." },
        { name: 'PrDeep', text: "Context loaded. Jokes compiling…" },
      ]
      for (const g of greetings) {
        setTimeout(() => {
          try { ws.send(JSON.stringify({ type: 'message', author: g.name, text: g.text })) } catch { /* ignore send error */ }
        }, Math.floor(Math.random() * 300) + 100)
      }
  } catch { /* ignore greeting errors */ }

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
  try { meta.ws.send(JSON.stringify({ type: 'join:ack', peerId: meta.peerId, room, members })) } catch { /* ignore */ }

        // notify other members in the room about the join
        for (const c of rooms.get(room)!) {
          if (c !== meta && c.ws.readyState === c.ws.OPEN) {
            try { c.ws.send(JSON.stringify({ type: 'peer-joined', peerId: meta.peerId })) } catch { /* ignore */ }
          }
        }
        return
      }

      // signaling messages: offer/answer/ice + simple chat 'message'
      if (['offer', 'answer', 'ice', 'message'].includes(msg.type)) {
        // If this is a chat message, generate humorous bot replies back to the sender
        if (msg.type === 'message' && typeof msg.text === 'string') {
          const chosen = typeof msg.bot === 'string' ? bots.find(b => b.name.toLowerCase() === String(msg.bot).toLowerCase()) : null
          if (chosen) {
            const line = chosen.lines[Math.floor(Math.random() * chosen.lines.length)]
            setTimeout(() => {
              try { meta.ws.send(JSON.stringify({ type: 'message', author: chosen.name, text: line })) } catch { /* ignore */ }
            }, 200)
          } else {
            const picks = bots.sort(() => 0.5 - Math.random()).slice(3)
            picks.forEach((b, i) => {
              const line = b.lines[Math.floor(Math.random() * b.lines.length)]
              setTimeout(() => {
                try { meta.ws.send(JSON.stringify({ type: 'message', author: b.name, text: line })) } catch { /* ignore send error */ }
              }, 200 + i * 250)
            })
          }
        }

        // if targetPeer provided, deliver only to that peer in same room
        if (msg.targetPeer) {
          // send to specific peer within the same room
          const room = meta.room
          const set = room ? rooms.get(room) : clients
          for (const c of (set || clients)) {
            if (c.peerId === msg.targetPeer && c.ws.readyState === c.ws.OPEN) {
              try { c.ws.send(JSON.stringify({ ...msg, from: meta.peerId })) } catch { /* ignore */ }
            }
          }
          return
        }

        // otherwise broadcast within the same room (or to all if no room)
        const set = meta.room ? rooms.get(meta.room) : clients
        for (const c of (set || clients)) {
          if (c === meta) continue
          if (c.ws.readyState !== c.ws.OPEN) continue
          try { c.ws.send(JSON.stringify({ ...msg, from: meta.peerId })) } catch { /* ignore */ }
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
