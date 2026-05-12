// import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // 🟢 Whitelist Cloudinary
      },
      // If you still have IPFS or local server links, whitelist those too:
      {
        protocol: 'http',
        hostname: 'localhost', 
      }
    ],
  },
};

export default nextConfig;
