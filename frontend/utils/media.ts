export function normalizeMediaUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null
  // Already absolute
  if (/^https?:\/\//i.test(url)) return url
  // Ensure it starts with a slash
  const path = url.startsWith('/') ? url : `/${url}`
  // In browser, build absolute from current origin (ALB routes /uploads, /avatars to backend)
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`
  return path
}
