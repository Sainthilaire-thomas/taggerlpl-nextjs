/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactive ESLint pendant le build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Garde la vérification TypeScript active
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
