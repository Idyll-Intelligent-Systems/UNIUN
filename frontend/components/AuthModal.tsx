import React, { useState } from 'react'
import Button from './ui/Button'
import Card from './ui/Card'
import Icons from './ui/icons'
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
      </Card>
    </div>
  )
}
