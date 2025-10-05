import React, { useState } from 'react'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import AuthModal from './AuthModal'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showAuth, setShowAuth] = useState(false)
  return (
    <div className="min-h-screen bg-galaxy text-white">
      <TopNav onOpenAuth={() => setShowAuth(true)} />
      <main className="pt-4 pb-24">{children}</main>
      <BottomNav />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
