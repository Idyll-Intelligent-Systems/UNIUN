/** @type {import('next').NextConfig} */
// Resolve an API base only when explicitly provided (local dev) to avoid proxying
// inside containers in production. In production, we rely on the ALB path rules
// to route /api, /uploads, and /avatars directly to the backend.
const isProd = process.env.NODE_ENV === 'production'
let apiBase = process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE
if (!apiBase && !isProd) {
  apiBase = 'http://localhost:4000'
}
// Small diagnostic to confirm the proxy base at server start (if any)
// eslint-disable-next-line no-console
console.log('[next.config] proxy apiBase =', apiBase || '(disabled)')
let remotePatterns = []
try {
  const u = new URL(apiBase)
  remotePatterns = [
    { protocol: u.protocol.replace(':',''), hostname: u.hostname, port: u.port || undefined, pathname: '/uploads/**' },
    { protocol: u.protocol.replace(':',''), hostname: u.hostname, port: u.port || undefined, pathname: '/avatars/**' },
  ]
} catch {}

const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns, unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: '/trending', destination: '/trends', permanent: true },
    ]
  },
  async rewrites() {
    if (!apiBase) return []
    return [
      { source: '/api/:path*', destination: `${apiBase}/api/:path*` },
      { source: '/uploads/:path*', destination: `${apiBase}/uploads/:path*` },
      { source: '/avatars/:path*', destination: `${apiBase}/avatars/:path*` },
    ]
  },
}

module.exports = nextConfig
