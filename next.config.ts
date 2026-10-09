import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    'sharp',
    '@google/genai',
  ],
};

export default nextConfig;
