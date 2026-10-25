import type { NextConfig } from "next";

const apiBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://snappresent-backend.onrender.com';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${apiBase}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
