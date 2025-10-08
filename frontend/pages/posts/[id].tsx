import type { GetServerSideProps } from 'next'
import ContentCard from '../../components/ContentCard'

type Props = { item: any }

export default function PostDetail({ item }: Props) {
  return (
    <div className="p-4">
      <ContentCard item={item} />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.params as { id: string }
  const req = ctx.req
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http'
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string)
  const origin = `${proto}://${host}`
  const res = await fetch(`${origin}/api/posts/${encodeURIComponent(String(id))}`)
  if (!res.ok) return { notFound: true }
  const p = await res.json()
  const item = {
    id: p.id || p._id || (p._id && p._id.toString && p._id.toString()),
    title: p.title,
    mediaType: p.mediaType || 'image',
    mediaUrl: p.mediaUrl || null,
    likes: p.likes || 0,
    replies: p.replies || 0,
    reposts: p.reposts || 0,
    views: p.views || 0,
    ownerId: p.ownerId,
    price: typeof p.price === 'number' ? p.price : undefined,
  }
  return { props: { item } }
}
