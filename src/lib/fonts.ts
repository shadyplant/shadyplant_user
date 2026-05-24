import { Geist_Mono, Inter } from "next/font/google";

export const appSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app-sans",
  fallback: ["Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

export const appMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app-mono",
  fallback: [
    "SFMono-Regular",
    "Consolas",
    "Liberation Mono",
    "Menlo",
    "monospace",
  ],
});
