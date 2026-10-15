import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets other devices on your network (e.g. a phone) load the dev
  // server. Set DEV_ORIGINS=192.168.1.20,10.0.0.5 in .env.local to use it.
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(",").map((o) => o.trim()) ?? [],
};

export default nextConfig;
