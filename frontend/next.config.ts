import type { NextConfig } from "next";

const apiHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").hostname;
  } catch {
    return "localhost";
  }
})();

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: apiHost,
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: apiHost,
        pathname: "/media/**",
      },
    ],
  },

  async rewrites() {
    return [
      // Proxy /media/* requests to the FastAPI backend so plain <img> tags
      // (used in HomeView, admin preview, etc.) load correctly from the
      // same origin as the frontend.
      {
        source: "/media/:path*",
        destination: `${apiUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;