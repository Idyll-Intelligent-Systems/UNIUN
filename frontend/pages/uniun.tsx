import Layout from '../components/Layout'
import { Card } from '../components/ui/Card'
import { useEffect, useRef, useState } from 'react'

export default function Uniun() {
  const [msgs, setMsgs] = useState<string[]>([])
  const [text, setText] = useState('')
  const [peerId, setPeerId] = useState<string | null>(null)
  const [members, setMembers] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const [turnConfig, setTurnConfig] = useState<any>(null)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_BASE || 'http://localhost:4000'
    const url = (base.replace(/^http/, 'ws')) + '/ws'
    // fetch turn/stun config from backend if available
    ;(async () => {
      try {
        const res = await fetch(`${base}/api/turn`)
        if (res.ok) setTurnConfig(await res.json())
      } catch (e) {
        // ignore
      }
    })()
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = async (ev) => {
      try {
        const d = JSON.parse(ev.data)
        if (!d || !d.type) return
        if (d.type === 'message' && d.text) setMsgs(prev => [...prev, d.text])
        if (d.from) setMsgs(prev => [...prev, `from:${d.from}`])

        if (d.type === 'join:ack') {
          setPeerId(d.peerId)
          setMembers(d.members || [])
          setMsgs(prev => [...prev, `joined ack: ${d.peerId}`])
          return
        }
        if (d.type === 'peer-joined') {
          setMembers(prev => Array.from(new Set([...prev, d.peerId])))
          setMsgs(prev => [...prev, `peer-joined:${d.peerId}`])
          return
        }
        // signaling messages: offer/answer/ice
        if (d.type === 'offer') {
          await ensurePeer()
          const pc = pcRef.current!
          await pc.setRemoteDescription(new RTCSessionDescription(d.offer))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          const payload: any = { type: 'answer', answer }
          if (d.from) payload.targetPeer = d.from
          ws.send(JSON.stringify(payload))
        }
        if (d.type === 'answer') {
          const pc = pcRef.current
          if (!pc) return
          await pc.setRemoteDescription(new RTCSessionDescription(d.answer))
        }
        if (d.type === 'ice' && d.candidate) {
          const pc = pcRef.current
          if (!pc) return
          try { await pc.addIceCandidate(d.candidate) } catch (e) { console.warn('addIce failed', e) }
        }
      } catch (err) {
        console.warn('ws message parse', err)
      }
    }
    ws.onopen = () => {
      setMsgs(prev => [...prev, 'signal:connected'])
      const peerId = 'peer-' + Math.random().toString(36).slice(2, 9)
      const roomInput = (document.getElementById('room') as HTMLInputElement | null)
      const room = roomInput?.value || undefined
      ws.send(JSON.stringify({ type: 'join', room, peerId }))
      setMsgs(prev => [...prev, `joined:${room || 'global'} as ${peerId}`])
    }
    ws.onclose = () => setMsgs(prev => [...prev, 'signal:closed'])
    return () => { if (ws && ws.readyState === ws.OPEN) ws.close() }
  }, [])

  async function ensureLocalStream() {
    if (localStreamRef.current) return localStreamRef.current
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      localStreamRef.current = s
      if (localVideoRef.current) localVideoRef.current.srcObject = s
      return s
    } catch (e) {
      console.error('getUserMedia failed', e)
      throw e
    }
  }

  async function ensurePeer() {
    if (pcRef.current) return pcRef.current
    const stun = process.env.NEXT_PUBLIC_STUN || 'stun:stun.l.google.com:19302'
    // prioritize server-provided TURN (securely provisioned) if available
    const iceServers: RTCIceServer[] = [{ urls: stun }]
    if (turnConfig && turnConfig.turn) {
      iceServers.push({ urls: turnConfig.turn.urls, username: turnConfig.turn.username, credential: turnConfig.turn.credential })
    } else {
      const turn = process.env.NEXT_PUBLIC_TURN || ''
      if (turn) iceServers.push({ urls: turn })
    }
    const pc = new RTCPeerConnection({ iceServers })
    pcRef.current = pc
    pc.onicecandidate = (ev) => {
      if (ev.candidate && wsRef.current) {
        const payload: any = { type: 'ice', candidate: ev.candidate }
        const target = (document.getElementById('targetPeer') as HTMLInputElement | null)?.value
        if (target) payload.targetPeer = target
        wsRef.current.send(JSON.stringify(payload))
      }
    }
    pc.ontrack = (ev) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = ev.streams[0]
    }
    const stream = await ensureLocalStream()
    stream.getTracks().forEach(t => pc.addTrack(t, stream))
    return pc
  }

  const startCall = async () => {
    try {
      const pc = await ensurePeer()
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      if (wsRef.current) {
        const target = (document.getElementById('targetPeer') as HTMLInputElement | null)?.value
        const payload: any = { type: 'offer', offer }
        if (target) payload.targetPeer = target
        wsRef.current.send(JSON.stringify(payload))
      }
      setMsgs(prev => [...prev, 'call:offer-sent'])
    } catch (e) {
      console.error('startCall failed', e)
      setMsgs(prev => [...prev, 'call:error'])
    }
  }

  const hangup = () => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setMsgs(prev => [...prev, 'call:ended'])
  }

  const send = () => {
    if (!wsRef.current || !text) return
    const payload = { type: 'message', text }
    try { wsRef.current.send(JSON.stringify(payload)) } catch (e) { console.warn(e) }
    setMsgs(prev => [...prev, `me: ${text}`])
    setText('')
  }

  return (
    <Layout>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">UNIUN - Creator Space</h2>
        <p className="text-sm text-gray-400">1:1 WebRTC demo using /ws signaling. This is a lightweight proof-of-concept — NAT traversal depends on STUN/TURN in real deployments.</p>

        <div className="flex gap-2 mb-4">
          <input id="room" placeholder="room (optional)" className="p-2 bg-gray-800 rounded" />
          <input id="targetPeer" placeholder="targetPeer (optional)" className="p-2 bg-gray-800 rounded" />
          <div className="text-sm text-gray-300">You: {peerId || '—'}</div>
          <div className="text-sm text-gray-300">Members: {members.join(', ') || '—'}</div>
        </div>

        <div className="mt-4 mb-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-2">Local</div>
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full bg-black h-48 object-cover rounded" />
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Remote</div>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full bg-black h-48 object-cover rounded" />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={startCall} className="px-4 py-2 bg-gold rounded">Start Call</button>
          <button onClick={hangup} className="px-4 py-2 bg-white/10 rounded">Hangup</button>
        </div>

        <div className="mt-4 mb-4">
          <div className="h-40 overflow-auto bg-black/20 p-2 rounded">
            {msgs.map((m, i) => <div key={i} className="text-sm text-gray-200">{m}</div>)}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input value={text} onChange={e => setText(e.target.value)} className="flex-1 p-2 bg-gray-800 rounded" placeholder="Signal message" />
          <button onClick={send} className="px-3 py-2 bg-gold rounded">Send</button>
        </div>
      </Card>
    </Layout>
  )
}
