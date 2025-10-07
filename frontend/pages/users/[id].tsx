import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Card } from '../../components/ui/Card'
import Image from 'next/image'
import api from '../../utils/api'
import ContentCard from '../../components/ContentCard'

export default function PublicUserProfile() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [myFollowing, setMyFollowing] = useState<string[]>([])
  const [me, setMe] = useState<any>(null)
  const [tab, setTab] = useState<'posts'|'followers'|'following'>('posts')
  const [followersList, setFollowersList] = useState<any[]>([])
  const [followingList, setFollowingList] = useState<any[]>([])

  useEffect(() => {
    api.me().then(setMe).catch(()=>setMe(null))
  }, [])

  useEffect(() => {
    const uid = (id as string) || ''
    if (!uid) return
    ;(async () => {
      try {
        const udata = await api.api(`/api/users/lookup?ids=${encodeURIComponent(uid)}`)
        setUser(Array.isArray(udata) ? udata[0] : null)
      } catch { setUser(null) }
      try {
  const pdata = await api.api(`/api/posts?ownerId=${encodeURIComponent(uid)}`)
  // ensure price is present for ContentCard
  const normalized = Array.isArray(pdata) ? pdata.map((p:any)=> ({ ...p, price: (typeof p.price === 'number' ? p.price : undefined) })) : []
  setPosts(normalized)
      } catch { setPosts([]) }
      try {
        const flw = await api.api(`/api/users/${encodeURIComponent(uid)}/followers?expand=1`)
        setFollowersList(Array.isArray(flw) ? flw : [])
      } catch { setFollowersList([]) }
      try {
        const flg = await api.api(`/api/users/${encodeURIComponent(uid)}/following?expand=1`)
        setFollowingList(Array.isArray(flg) ? flg : [])
      } catch { setFollowingList([]) }
      try {
        const my = await api.me().catch(()=>null)
        const myId = my?.id || my?._id
        if (myId) {
          // use expand=1 to get IDs reliably
          const list:any[] = await api.api(`/api/users/${encodeURIComponent(myId)}/following?expand=1`)
          setMyFollowing(list.map(u => u.id || u._id).filter(Boolean))
        }
      } catch {}
    })()
  }, [id])

  async function toggleFollow(uid: string) {
    if (!me) { alert('Login required'); return }
    try {
      if (myFollowing.includes(uid)) {
        await api.unfollowUser(uid)
        setMyFollowing(prev => prev.filter(x => x !== uid))
      } else {
        await api.followUser(uid)
        setMyFollowing(prev => [...prev, uid])
      }
    } catch (e: any) {
      alert('Follow failed: ' + e.message)
    }
  }

  return (
    <Card className="p-4">
      {!user ? (
        <div className="text-gray-500">Loading user...</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {user.avatarUrl && <Image src={user.avatarUrl} alt={user.username} width={40} height={40} className="rounded-full" />}
              <div>
                <div className="text-lg font-semibold">{user.username}</div>
                <div className="text-xs text-gray-500">ID: {user.id || user._id}</div>
                <div className="text-xs text-gray-400 mt-1">Followers: {followersList.length} · Following: {followingList.length}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>router.push(`/messages-direct?with=${encodeURIComponent(String(user.id || user._id))}`)} className="px-3 py-2 bg-gray-700 rounded text-white">Message</button>
              <button onClick={()=>toggleFollow(user.id || user._id)} className="px-3 py-2 bg-gold rounded text-black">
                {myFollowing.includes(user.id || user._id) ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          </div>
          <div className="flex gap-3 border-b border-gray-800 mb-3">
            {(['posts','followers','following'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 ${tab===t ? 'text-gold border-b-2 border-gold' : 'text-gray-400'}`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>

          {tab === 'posts' && (
            <>
              <h3 className="font-semibold mb-2">Posts</h3>
              <div className="space-y-4">
                {posts.length === 0 && <div className="text-gray-500">No posts yet.</div>}
                {posts.map((p:any) => (
                  <ContentCard key={p._id || p.id} item={p} />
                ))}
              </div>
            </>
          )}

          {tab === 'followers' && (
            <>
              <h3 className="font-semibold mb-2">Followers</h3>
              {followersList.length===0 ? (
                <div className="text-gray-500">No followers yet.</div>
              ) : (
                <ul className="space-y-2">
                  {followersList.map((u:any, i:number)=> (
                    <li key={u.id || i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {u.avatarUrl && <Image src={u.avatarUrl} alt={u.username} width={24} height={24} className="rounded-full" />}
                        <span className="text-gray-200">{u.username}</span>
                        {!myFollowing.includes(u.id || u._id) && (
                          <span className="ml-2 text-[10px] text-gray-400 border border-gray-700 rounded px-1 py-0.5">Follow back</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>router.push(`/messages-direct?with=${encodeURIComponent(String(u.id || u._id))}`)} className="px-2 py-1 text-sm bg-gray-700 rounded text-white">Message</button>
                        <button onClick={()=>toggleFollow(u.id || u._id)} className="px-2 py-1 text-sm bg-gold rounded text-black">
                          {myFollowing.includes(u.id || u._id) ? 'Unfollow' : 'Follow'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === 'following' && (
            <>
              <h3 className="font-semibold mb-2">Following</h3>
              {followingList.length===0 ? (
                <div className="text-gray-500">Not following anyone yet.</div>
              ) : (
                <ul className="space-y-2">
                  {followingList.map((u:any, i:number)=> (
                    <li key={u.id || i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {u.avatarUrl && <Image src={u.avatarUrl} alt={u.username} width={24} height={24} className="rounded-full" />}
                        <span className="text-gray-200">{u.username}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>router.push(`/messages-direct?with=${encodeURIComponent(String(u.id || u._id))}`)} className="px-2 py-1 text-sm bg-gray-700 rounded text-white">Message</button>
                        <button onClick={()=>toggleFollow(u.id || u._id)} className="px-2 py-1 text-sm bg-gold rounded text-black">
                          {myFollowing.includes(u.id || u._id) ? 'Unfollow' : 'Follow'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </Card>
  )
}
