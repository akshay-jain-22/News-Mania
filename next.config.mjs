/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/auth',
        permanent: true,
      },
      {
        source: '/auth/register',
        destination: '/auth',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
