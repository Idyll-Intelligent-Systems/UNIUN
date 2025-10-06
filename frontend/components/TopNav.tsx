import Button from './ui/Button'
import Card from './ui/Card'
import Icons from './ui/icons'
import { useRouter } from 'next/router'

export default function TopNav({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const router = useRouter()
  return (
    <Card className="w-full border-b border-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-gold font-bold cursor-pointer" onClick={() => onOpenAuth && onOpenAuth()}>UNIUN</div>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push('/search')}><Icons.Search size={16} /> Search</Button>
        <Button onClick={() => router.push('/messages-home')}><Icons.MessageSquare size={16} /> Messages</Button>
        <Button onClick={() => router.push('/upload')}><Icons.Upload size={16} /> Upload</Button>
        <Button onClick={() => onOpenAuth && onOpenAuth()}><Icons.User size={16} /> Account</Button>
      </div>
    </Card>
  )
}
