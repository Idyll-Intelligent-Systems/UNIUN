import React, { useCallback, useEffect, useState } from 'react'
import Button from './ui/Button'
import Card from './ui/Card'
// import Icons from './ui/icons'
import { register, login } from '../utils/api'

export default function AuthModal({ onClose }: { onClose?: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function submit() {
    try {
      if (isLogin) {
        const res: any = await login(username, password)
        localStorage.setItem('token', res.token)
        alert('Logged in')
      } else {
        await register(username, password)
        alert('Registered')
      }
      onClose && onClose()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const onGoogleCredential = useCallback(async (cred: string) => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'
      const res = await fetch(`${base}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: cred }) })
      if (!res.ok) throw new Error('Google sign-in failed')
      const data = await res.json()
      localStorage.setItem('token', data.token)
      onClose && onClose()
    } catch (e: any) {
      alert('Google sign-in error: ' + e.message)
    }
  }, [onClose])

  // Google Sign-In
  useEffect(() => {
    if (typeof window === 'undefined') return
    const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!cid) return
    const scriptId = 'google-identity'
    function init() {
      try {
        // Assign global for HTML-less callback use if needed
        ;(window as any).onGoogleCred = (resp: any) => onGoogleCredential(resp.credential)
        const google = (window as any).google
        if (!google?.accounts?.id) return
        google.accounts.id.initialize({ client_id: cid, callback: (resp: any) => onGoogleCredential(resp.credential) })
        const el = document.getElementById('googleSignInDiv')
        if (el) google.accounts.id.renderButton(el, { theme: 'outline', size: 'large' })
      } catch {}
    }
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.id = scriptId
      s.onload = init
      document.head.appendChild(s)
    } else {
      init()
    }
  }, [onGoogleCredential])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      <Card className="p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">{isLogin ? 'Login' : 'Register'}</h3>
        <input className="w-full mb-2 p-2 rounded bg-gray-900" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="w-full mb-4 p-2 rounded bg-gray-900" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2 justify-end">
          <Button onClick={() => setIsLogin(!isLogin)} variant="ghost">{isLogin ? 'Switch to Register' : 'Switch to Login'}</Button>
          <Button onClick={submit}>{isLogin ? 'Login' : 'Register'}</Button>
        </div>
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <div className="mt-4">
            <div id="googleSignInDiv" />
          </div>
        )}
      </Card>
    </div>
  )
}
