"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <Link
      href="https://wa.me/919876543210"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_32px_rgba(37,211,102,0.32)] transition-transform hover:-translate-y-0.5"
    >
      <MessageCircle size={18} />
      WhatsApp
    </Link>
  );
}
