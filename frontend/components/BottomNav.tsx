import Button from './ui/Button'
import Card from './ui/Card'
import Icons from './ui/icons'
import Link from 'next/link'

export default function BottomNav() {
  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#071018] rounded-full px-6 py-3 flex gap-6 items-center">
      <Link href="/">
        <Button><Icons.Home size={16} /></Button>
      </Link>
      <Link href="/shop">
        <Button><Icons.ShoppingCart size={16} /></Button>
      </Link>
      <Link href="/upload">
        <Button><Icons.PlusCircle size={16} /></Button>
      </Link>
      <Link href="/messages">
        <Button><Icons.MessageSquare size={16} /></Button>
      </Link>
      <Link href="/profile">
        <Button><Icons.User size={16} /></Button>
      </Link>
    </Card>
  )
}
