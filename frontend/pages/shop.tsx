import Layout from '../components/Layout'
import { Card } from '../components/ui/Card'
import ContentCard from '../components/ContentCard'

export default function Shop() {
  const sample = [
    { id: 's1', title: 'Premium Beat', mediaType: 'audio', likes: 10, replies: 1, reposts: 0, views: 200 },
    { id: 's2', title: 'HD Photo Pack', mediaType: 'image', likes: 4, replies: 0, reposts: 0, views: 50 }
  ]
  return (
    <Layout>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Shop</h2>
        <div className="grid gap-4">
          {sample.map(s => <ContentCard key={s.id} item={s as any} />)}
        </div>
      </Card>
    </Layout>
  )
}
