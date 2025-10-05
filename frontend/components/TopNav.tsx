import Button from './ui/Button'
import Card from './ui/Card'
import Icons from './ui/icons'

export default function TopNav({ onOpenAuth }: { onOpenAuth?: () => void }) {
  return (
    <Card className="w-full border-b border-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-gold font-bold cursor-pointer" onClick={() => onOpenAuth && onOpenAuth()}>UNIUN</div>
      </div>
      <div className="flex items-center gap-4">
        <Button><Icons.Search size={16} /> Search</Button>
        <Button><Icons.Upload size={16} /> Upload</Button>
        <Button onClick={() => onOpenAuth && onOpenAuth()}><Icons.User size={16} /> Account</Button>
      </div>
    </Card>
  )
}
