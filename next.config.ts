/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Performance optimizations (swcMinify is now default in Next.js 15)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimize images
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'github.githubassets.com',
      'seeklogo.com',
      'www.docker.com',
      'github.com',
      'x.com',
      'pbs.twimg.com',
      'peerlist.io',
      'api.producthunt.com',
      'www.producthunt.com'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@/components'],
  },
};

module.exports = nextConfig;
