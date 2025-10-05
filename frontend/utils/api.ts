const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

export async function api(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  // some endpoints return empty 204
  if (res.status === 204) return null
  return res.json()
}

export async function register(username: string, password: string) {
  return api('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function login(username: string, password: string) {
  return api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function createPost(title: string, mediaType: string, mediaUrl?: string) {
  return api('/api/posts', { method: 'POST', body: JSON.stringify({ title, mediaType, mediaUrl }) })
}

export async function listPosts() {
  return api('/api/posts')
}

// interactions
export async function likePost(postId: string) {
  return api(`/api/interactions/${postId}/like`, { method: 'POST' })
}

export async function repostPost(postId: string) {
  return api(`/api/interactions/${postId}/repost`, { method: 'POST' })
}

export async function bookmarkPost(postId: string) {
  return api(`/api/interactions/${postId}/bookmark`, { method: 'POST' })
}

// cart
export async function addToCart(item: { id: string; title: string; price?: number }) {
  return api('/api/cart/add', { method: 'POST', body: JSON.stringify(item) })
}

export async function getCart() {
  return api('/api/cart')
}

export async function checkoutCart() {
  return api('/api/cart/checkout', { method: 'POST' })
}

export default { api, register, login, createPost, listPosts, likePost, repostPost, bookmarkPost, addToCart, getCart, checkoutCart }
