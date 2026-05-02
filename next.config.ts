import path from "node:path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Support the repo-root .env file used alongside this frontend folder.
loadEnvConfig(path.join(__dirname, ".."));

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.1.36"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // ✅ allow all domains
      },
    ],
  },
};

export default nextConfig;
