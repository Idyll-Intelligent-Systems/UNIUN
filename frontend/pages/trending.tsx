import Layout from '../components/Layout'
import ContentCard from '../components/ContentCard'

export default function Trending() {
  const sample = [
    { id: 't1', title: 'Viral Clip', mediaType: 'video', likes: 500, replies: 30, reposts: 100, views: 20000 }
  ]
  return (
    <Layout>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Trending</h2>
        {sample.map(s => <ContentCard key={s.id} item={s as any} />)}
      </div>
    </Layout>
  )
}
