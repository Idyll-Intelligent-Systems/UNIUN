/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4002', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '4002', pathname: '/uploads/**' },
    ],
  },
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: 'http://localhost:4002/uploads/:path*' },
      { source: '/avatars/:path*', destination: 'http://localhost:4002/avatars/:path*' },
    ]
  },
}

module.exports = nextConfig
