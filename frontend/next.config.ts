import type { NextConfig } from "next";

const apiBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://snappresent-attendancesystem-l216.onrender.com';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
