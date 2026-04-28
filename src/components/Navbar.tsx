"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import GGNIcon from "@/app/GGN.ico";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/#about" },
    { label: "Blogs", href: "/blogs" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <div className="sticky inset-x-0 top-0 z-50 w-full px-3 pt-3 md:px-6 md:pt-5">
      {/* Main Navbar */}
      <nav className="theme-panel-strong mx-auto flex max-w-6xl items-center justify-between rounded-[2rem] border border-white/30 bg-[rgba(255,255,255,0.78)] px-4 py-3 backdrop-blur-xl md:px-6 md:py-4">
        {/* Logo Area */}
        <Link
          href="/"
          className="flex items-center gap-2 p-2 pr-4 shadow-[0_12px_28px_rgba(33,79,20,0.08)]"
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-full">
            <Image src={GGNIcon} alt="Grass Green Nursery logo" fill className="object-contain" />
          </div>
          <span className="text-[#1e4215] font-bold text-sm leading-tight">
            Grass <br /> Green Nursery
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-3 py-2 text-[#32522b] font-medium transition-colors hover:bg-[#eef8df] hover:text-[#1e4215]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Action Button */}
        <Link
          href="/checkout"
          className="theme-button group relative hidden overflow-hidden rounded-full px-8 py-3 text-lg font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(33,79,20,0.28)] active:translate-y-0 active:scale-[0.98] md:inline-flex cursor-pointer"
        >
          <span className="absolute inset-y-0 left-[-30%] w-16 -skew-x-12 bg-white/20 opacity-0 transition-all duration-500 group-hover:left-[110%] group-hover:opacity-100" />
          <span className="relative z-10">Checkout</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="theme-panel inline-flex items-center justify-center rounded-full p-3 text-[#1e4215] transition-colors hover:bg-[#f6fff1] md:hidden"
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {isMenuOpen ? (
        <div className="theme-panel-strong mx-auto mt-3 max-w-6xl rounded-[2rem] px-6 py-5 md:hidden">
          <div className="flex flex-col items-center gap-4 text-center">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="w-full rounded-full px-4 py-2 text-[#32522b] font-medium transition-colors hover:bg-[#eef8df] hover:text-[#1e4215]"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/checkout"
              onClick={() => setIsMenuOpen(false)}
              className="theme-button group relative mt-2 w-full overflow-hidden rounded-full px-6 py-3 text-base font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(33,79,20,0.28)] active:translate-y-0 active:scale-[0.98]"
            >
              <span className="absolute inset-y-0 left-[-30%] w-16 -skew-x-12 bg-white/20 opacity-0 transition-all duration-500 group-hover:left-[110%] group-hover:opacity-100" />
              <span className="relative z-10">Checkout</span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
