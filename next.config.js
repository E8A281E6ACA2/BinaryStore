/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-r2-domain.com'],
  },
  output: 'standalone',
};

module.exports = nextConfig;
