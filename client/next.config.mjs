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
  swcMinify: true,
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
}

export default nextConfig
