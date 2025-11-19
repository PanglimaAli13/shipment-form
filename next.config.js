/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  }
  // Hapus env.DATABASE_URL dari sini, gunakan process.env langsung
}

module.exports = nextConfig