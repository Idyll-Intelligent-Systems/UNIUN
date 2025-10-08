import React, { useEffect, useState, createContext } from 'react'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import AuthModal from './AuthModal'
import { login, register } from '../utils/api'

type Theme = 'dark' | 'default' | 'light-olive' | 'futuristic'
type Motion = 'auto' | 'reduce'
export const ThemeContext = createContext<{theme: Theme, setTheme: (t: Theme) => void, motion: Motion, toggleMotion: () => void}>({ theme: 'dark', setTheme: () => {}, motion: 'auto', toggleMotion: () => {} })

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
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) return saved
    // prefers-color-scheme
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'default' : 'dark' } catch { return 'dark' }
  })
  const [motion, setMotion] = useState<Motion>(() => (typeof window !== 'undefined' ? ((localStorage.getItem('motion') as Motion) || 'auto') : 'auto'))
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.classList.remove('theme-light','theme-default','theme-light-olive','theme-futuristic')
      if (theme === 'default') root.classList.add('theme-default')
      else if (theme === 'light-olive') root.classList.add('theme-light-olive')
      else if (theme === 'futuristic') root.classList.add('theme-futuristic')
      // dark is implicit (no extra class)
      try { localStorage.setItem('theme', theme) } catch {}
    }
  }, [theme])
  const setThemeSafe = (t: Theme) => setTheme(t)
  const toggleMotion = () => setMotion(m => m === 'reduce' ? 'auto' : 'reduce')
  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeSafe, motion, toggleMotion }}>
      <div className={`min-h-screen bg-galaxy text-white safe-top safe-bottom ${motion==='reduce' ? 'reduce-motion' : ''}`} style={{ background: 'linear-gradient(135deg, var(--bg-start) 0%, var(--bg-end) 100%)' }}>
        <TopNav onOpenAuth={() => setShowAuth(true)} />
        <main className="container-premium has-topnav has-bottomnav">{children}</main>
        <BottomNav />
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    </ThemeContext.Provider>
  )
}
