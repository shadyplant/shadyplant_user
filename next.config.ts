import path from "node:path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Support the repo-root .env file used alongside this frontend folder.
loadEnvConfig(path.join(__dirname, ".."));

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' https://sandbox.cashfree.com https://sdk.cashfree.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://accounts.google.com https://apis.google.com https://www.gstatic.com https://www.chatbase.co https://sdk.cashfree.com",
  "connect-src 'self' https: http://localhost:8080 http://127.0.0.1:8080 ws://localhost:* ws://127.0.0.1:* https://maps.googleapis.com https://maps.gstatic.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.googleapis.com https://www.chatbase.co",
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.web.app https://www.chatbase.co https://chatbase.co https://sdk.cashfree.com https://sandbox.cashfree.com",
].join("; ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["**.*"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
