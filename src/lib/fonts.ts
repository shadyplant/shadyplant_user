import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

export const appSans = Plus_Jakarta_Sans({
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
