/** @type {import('next').NextConfig} */
const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4002'
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
  images: { remotePatterns },
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: `${apiBase}/uploads/:path*` },
      { source: '/avatars/:path*', destination: `${apiBase}/avatars/:path*` },
    ]
  },
}

module.exports = nextConfig
