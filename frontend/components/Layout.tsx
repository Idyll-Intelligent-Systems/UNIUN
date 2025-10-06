import React, { useEffect, useState } from 'react'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import AuthModal from './AuthModal'
import { login, register } from '../utils/api'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showAuth, setShowAuth] = useState(false)
  useEffect(() => {
    // Auto login as veee/veee if no token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      (async () => {
        try {
          // try login, if fails register then login
          let res: any = await login('veee', 'veee')
          if (!res?.token) {
            await register('veee', 'veee')
            res = await login('veee', 'veee')
          }
          if (res?.token) localStorage.setItem('token', res.token)
        } catch (e) {
          // ignore auto-login issues
        }
      })()
    }
  }, [])
  return (
    <div className="min-h-screen bg-galaxy text-white">
      <TopNav onOpenAuth={() => setShowAuth(true)} />
      <main className="pt-4 pb-24">{children}</main>
      <BottomNav />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
