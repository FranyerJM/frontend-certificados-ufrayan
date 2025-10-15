/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/generate',
        destination: 'https://api-certificados-ufrayan.onrender.com/api/crear_certificados',
      },
    ]
  },
}

export default nextConfig