import Button from './ui/Button'
import Card from './ui/Card'
import Icons from './ui/icons'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function TopNav({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const router = useRouter()
  const [unread, setUnread] = useState<number>(0)

  useEffect(() => {
    let timer: any
    const load = async () => {
      try { const r:any = await api.unreadCount(); setUnread(Number(r.total || 0)) } catch { setUnread(0) }
      timer = setTimeout(load, 15000)
    }
    load()
    return () => { if (timer) clearTimeout(timer) }
  }, [])
  return (
    <Card className="w-full border-b border-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-gold font-bold cursor-pointer" onClick={() => onOpenAuth && onOpenAuth()}>UNIUN</div>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push('/search')}><Icons.Search size={16} /> Search</Button>
        <Button onClick={() => router.push('/messages-direct')} className="relative">
          <Icons.MessageSquare size={16} /> Messages
          {unread>0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </Button>
        <Button onClick={() => router.push('/upload')}><Icons.Upload size={16} /> Upload</Button>
        <Button onClick={() => {
          const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
          if (t) router.push('/profile'); else onOpenAuth && onOpenAuth()
        }}><Icons.User size={16} /> Account</Button>
      </div>
    </Card>
  )
}
