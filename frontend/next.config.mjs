/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure proper routing for Vercel
  output: 'standalone',
  serverExternalPackages: [],
}

export default nextConfig
