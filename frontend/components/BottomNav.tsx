import Button from './ui/Button'
import Card from './ui/Card'
import Icons from './ui/icons'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BottomNav() {
  const router = useRouter()
  const isActive = (path: string) => router.pathname === path
  return (
    <Card className="fixed-bottom-safe bottom-nav glass shadow-premium transition-premium rounded-full px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 flex items-center gap-4 sm:gap-6 md:gap-8 backdrop-blur-md border border-white/10 z-40">
      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
        <Link href="/">
          <Button className={isActive('/') ? 'ring-2 ring-[#3b82f6]' : ''}><Icons.Home size={18} strokeWidth={isActive('/') ? 2.5 : 1.75} /></Button>
        </Link>
        <Link href="/shop">
          <Button className={isActive('/shop') ? 'ring-2 ring-[#3b82f6]' : ''}><Icons.ShoppingCart size={18} strokeWidth={isActive('/shop') ? 2.5 : 1.75} /></Button>
        </Link>
        <Link href="/upload">
          <Button className={isActive('/upload') ? 'ring-2 ring-[#3b82f6]' : ''}><Icons.PlusCircle size={18} strokeWidth={isActive('/upload') ? 2.5 : 1.75} /></Button>
        </Link>
        <Link href="/trends">
          <Button className={isActive('/trends') ? 'ring-2 ring-[#3b82f6]' : ''}><Icons.Video size={18} strokeWidth={isActive('/trends') ? 2.5 : 1.75} /></Button>
        </Link>
        <Link href="/profile">
          <Button className={isActive('/profile') ? 'ring-2 ring-[#3b82f6]' : ''}><Icons.User size={18} strokeWidth={isActive('/profile') ? 2.5 : 1.75} /></Button>
        </Link>
      </div>
    </Card>
  )
}
