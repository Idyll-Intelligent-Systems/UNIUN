import Layout from '../components/Layout'
import { Card } from '../components/ui/Card'
import ContentCard from '../components/ContentCard'

export default function Profile() {
  const posts = [{ id: 'p1', title: 'My Art', mediaType: 'image', likes: 12, replies: 2, reposts: 1, views: 300 }]
  return (
    <Layout>
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>
        <p className="text-gray-400 mb-4">Bio, stats, media</p>
        {posts.map(p => <ContentCard key={p.id} item={p as any} />)}
      </Card>
    </Layout>
  )
}
