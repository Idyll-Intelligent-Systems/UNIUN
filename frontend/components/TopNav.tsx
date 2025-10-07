import Button from './ui/Button'
import Card from './ui/Card'
import Icons from './ui/icons'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import api from '../utils/api'
import Image from 'next/image'
import { useToast } from './ui/Toast'

export default function TopNav({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const router = useRouter()
  const [unread, setUnread] = useState<number>(0)
  const [authed, setAuthed] = useState<boolean>(false)
  const [me, setMe] = useState<any>(null)
  const { show } = useToast()

  useEffect(() => {
    let timer: any
    setAuthed(typeof window !== 'undefined' ? !!localStorage.getItem('token') : false)
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      api.me().then(setMe).catch(()=>setMe(null))
    } else {
      setMe(null)
    }
    const load = async () => {
      try { if (typeof window !== 'undefined' && localStorage.getItem('token')) { const r:any = await api.unreadCount(); setUnread(Number(r.total || 0)) } } catch { setUnread(0) }
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
  <Button onClick={() => { show('Opening search', 'info'); router.push('/search') }}><Icons.Search size={16} /> Search</Button>
        {authed && (
          <Button onClick={() => { show('Opening messages', 'info'); router.push('/messages-direct') }} className="relative">
            <Icons.MessageSquare size={16} /> Messages
            {unread>0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </Button>
        )}
        {authed ? (
          <Button onClick={() => { show('Opening upload', 'info'); router.push('/upload') }}><Icons.Upload size={16} /> Upload</Button>
        ) : (
          <Button onClick={() => onOpenAuth && onOpenAuth()}><Icons.Upload size={16} /> Upload</Button>
        )}
        <Button onClick={() => {
          const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
          if (t) router.push('/profile'); else onOpenAuth && onOpenAuth()
        }}>
          {me?.avatarUrl ? (
            <span className="inline-flex items-center gap-2" title={`Logged in as ${me?.username || me?.id || me?._id}`}>
              <Image src={me.avatarUrl} width={18} height={18} className="rounded-full" alt={me.username || 'me'} />
              <span className="inline-flex items-center gap-1">
                <span>{me?.username || 'Account'}</span>
                {me && <span className="text-[10px] text-gray-400">({me.id || me._id})</span>}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2" title={me ? `Logged in as ${me?.username || me?.id || me?._id}` : ''}>
              <Icons.User size={16} />
              <span className="inline-flex items-center gap-1">
                <span>{me?.username || 'Account'}</span>
                {me && <span className="text-[10px] text-gray-400">({me.id || me._id})</span>}
              </span>
            </span>
          )}
        </Button>
      </div>
    </Card>
  )
}
