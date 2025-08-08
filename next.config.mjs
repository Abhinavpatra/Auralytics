/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['pbs.twimg.com', 'abs.twimg.com', 'profile_images.twitter.com'],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'vercel.app', 'your-domain.com'],
    },
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  // Puppeteer configuration for production
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
      })
    }
    return config
  },
}

export default nextConfig
