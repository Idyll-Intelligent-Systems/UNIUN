import { useEffect, useRef, useState } from 'react'
import api from '../utils/api'
import { normalizeMediaUrl } from '../utils/media'

// Simple reels-like vertical feed: shows only video posts, one per viewport, swipe/scroll to move.
export default function Trends() {
  const [videos, setVideos] = useState<any[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    api.listPosts().then((items: any[]) => {
      if (!mounted) return
      const vids = (items || []).filter((p: any) => (p.mediaType === 'video' && p.mediaUrl))
        .map((p: any) => ({
          id: p.id || p._id || (p._id && p._id.toString()),
          title: p.title,
          mediaUrl: normalizeMediaUrl(p.mediaUrl),
        }))
      setVideos(vids)
    }).catch(() => setVideos([]))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // Snap to nearest child on scroll end
    let timeout: any
    const onScroll = () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        const children = Array.from(el.children) as HTMLElement[]
        const top = el.scrollTop
        let nearestIndex = 0
        let minDist = Number.POSITIVE_INFINITY
        children.forEach((child, idx) => {
          const dist = Math.abs(child.offsetTop - top)
          if (dist < minDist) { minDist = dist; nearestIndex = idx }
        })
        const target = children[nearestIndex]
        if (target) el.scrollTo({ top: (target as any).offsetTop, behavior: 'smooth' })
      }, 80)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [videos.length])

  useEffect(() => {
    // Auto play/pause based on intersection
    const el = containerRef.current
    if (!el) return
    const vids = Array.from(el.querySelectorAll('video')) as HTMLVideoElement[]
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const v = entry.target as HTMLVideoElement
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          v.play().catch(()=>{})
        } else {
          v.pause()
        }
      })
    }, { threshold: [0, 0.6, 1] })
    vids.forEach(v => obs.observe(v))
    return () => obs.disconnect()
  }, [videos])

  return (
    <div className="fixed inset-0 top-[64px] bottom-[84px]">
      <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory">
        {videos.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500">No videos yet</div>
        )}
        {videos.map((v, i) => (
          <section key={v.id || i} className="h-full w-full snap-start relative">
            <video className="absolute inset-0 w-full h-full object-cover" src={v.mediaUrl || ''} controls playsInline muted preload="metadata"/>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="text-white font-semibold">{v.title}</div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
