"use client";

import Image from "next/image";
import { Phone } from "lucide-react";

export default function WhatsAppButton() {
  const phoneNumber = "916001518547";
  const message = "Hello, I want to order lawn grass";

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-end gap-3">
      <a
        href={`tel:+${phoneNumber}`}
        className="theme-panel flex h-14 w-14 items-center justify-center rounded-full text-[#1e4215] shadow-[0_18px_35px_rgba(33,79,20,0.18)] transition-transform duration-300 hover:scale-110 active:scale-95"
        aria-label="Call now"
      >
        <Phone size={24} />
      </a>

      <span className="absolute bottom-0 right-0 inline-flex h-14 w-14 animate-ping rounded-full bg-[#9fd94f] opacity-70"></span>
      <button
        onClick={handleClick}
        className="theme-button relative flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 active:scale-95"
        aria-label="Contact on WhatsApp"
      >
        <Image
          src="https://img.icons8.com/?size=32&id=BkugfgmBwtEI&format=png&color=ffffff"
          alt="WhatsApp"
          width={32}
          height={32}
          className="h-8 w-8"
        />
      </button>
    </div>
  );
}
