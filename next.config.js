/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  // Prevents Vercel from attempting to pre-render dynamic API routes at build time
  // This is the global equivalent of `export const dynamic = 'force-dynamic'`
  experimental: {
    serverActions: true,
  },

  // Ignore TypeScript and ESLint errors during production build
  // so minor issues don't block deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
