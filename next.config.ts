import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    skipWaiting: true,
  },
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage CDN — replace PROJECT_ID with your actual project
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    return [
      {
        source: '/timeline',
        destination: '/us/timeline',
        permanent: true,
      },
      {
        source: '/vault',
        destination: '/us/vault',
        permanent: true,
      },
      {
        source: '/study',
        destination: '/growth/focus',
        permanent: true,
      },
      {
        source: '/projects',
        destination: '/growth/creative',
        permanent: true,
      },
      {
        source: '/projects/:id',
        destination: '/growth/creative/:id',
        permanent: true,
      },
      {
        source: '/memories',
        destination: '/us/vault',
        permanent: true,
      },
      {
        source: '/growth/memories',
        destination: '/us/vault',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
};

export default withPWA(nextConfig);

