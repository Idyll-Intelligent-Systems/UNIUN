import React, { useState } from 'react'
import Button from './ui/Button'
import Card from './ui/Card'
import { register, login } from '../utils/api'
import { useRouter } from 'next/router'

export default function AuthModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function submit() {
    try {
      if (isLogin) {
        const res: any = await login(username, password)
        localStorage.setItem('token', res.token)
        // Notify listeners that auth state changed
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:changed'))
        }
        // After basic auth login, go to profile
        router.push('/profile')
      } else {
        await register(username, password)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:changed'))
        }
        // After registration, switch to login for clarity
        setIsLogin(true)
      }
      onClose && onClose()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <Card className="glass shadow-premium transition-premium p-8 w-96 border border-white/10">
        <h3 className="heading-premium text-2xl mb-6 text-center">{isLogin ? 'Login' : 'Register'}</h3>
        <input className="w-full mb-3 p-3 rounded-lg bg-white/10 text-premium border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="w-full mb-5 p-3 rounded-lg bg-white/10 text-premium border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-premium" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2 justify-end">
          <Button onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Switch to Register' : 'Switch to Login'}</Button>
          <Button onClick={submit}>{isLogin ? 'Login' : 'Register'}</Button>
        </div>
      </Card>
    </div>
  )
}
