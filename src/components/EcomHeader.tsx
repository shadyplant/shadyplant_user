"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useMemo, useState } from "react";
import GGNIcon from "@/app/GGN.ico";
import { useWishlistItems } from "@/components/wishlistStore";
import { latestProducts } from "@/content/store";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Order Page", href: "/order" },
  { label: "Cart", href: "/cart" },
  { label: "Blogs", href: "/blogs" },
];

const stickyHeaderClass =
  "border-b border-white/20 bg-[rgba(248,251,246,0.34)] [box-shadow:0_6px_16px_-4px_rgba(36,54,27,0.12)] backdrop-blur-2xl backdrop-saturate-150";
type Suggestion = {
  label: string;
  meta: string;
  href: string;
};

export default function EcomHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const wishlistItems = useWishlistItems();
  const wishlistCount = wishlistItems.length;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const suggestions = useMemo<Suggestion[]>(() => {
    if (!normalizedSearch) {
      return [];
    }

    return latestProducts
      .filter((product) =>
        [product.name, product.category, product.badge, product.description].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      )
      .map((product) => ({
        label: product.name,
        meta: `${product.category} • ₹${product.price}`,
        href: `/order?search=${encodeURIComponent(product.name)}`,
      }))
      .slice(0, 6);
  }, [normalizedSearch]);

  const showSuggestions = isSearchFocused && suggestions.length > 0;

  function closeOverlays() {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setIsSearchFocused(false);
  }

  function renderSearchBox(placeholder: string, mobile = false) {
    return (
      <div className={`relative ${mobile ? "mt-3 md:hidden" : "hidden flex-1 md:flex"}`}>
        <div
          className={
            mobile
              ? "flex items-center gap-2 rounded-[1rem] border border-[#d9e4d5] bg-white/65 px-3 py-2.5"
              : "theme-input flex items-center gap-3 rounded-[1.15rem] border border-[#24361b]/10 bg-white/65 px-4 py-2.5"
          }
        >
          <Search size={17} className="text-[#69845d]" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setIsSearchFocused(false), 150);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-[#163318] outline-none placeholder:text-[#6f8167]"
          />
        </div>

        {showSuggestions ? (
          <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[#d7dfd2] bg-white shadow-xl">
            <div className="p-2">
              {suggestions.map((suggestion) => (
                <Link
                  key={`${suggestion.meta}-${suggestion.label}`}
                  href={suggestion.href}
                  onClick={closeOverlays}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-[#f4f8ef]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#173d12]">{suggestion.label}</p>
                    <p className="text-xs text-[#6b8b58]">{suggestion.meta}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50">
      <div className="flex items-center justify-center bg-[#1f1d1b] px-4 py-2.5 text-white md:hidden">
        <p className="flash-sale-text text-[9px] font-bold uppercase tracking-[0.24em]">
          <span className="text-[#ff7e47]">50%</span> OFF Flash sale!
        </p>
      </div>

      <header className={stickyHeaderClass}>
        <div className="mx-auto max-w-7xl px-4 py-2.5 md:px-6 md:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              {/* <span className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image src={GGNIcon} alt="Logo" fill className="object-contain" />
              </span> */}
              <span className="text-base font-black uppercase tracking-[0.2em] text-[#1f1d1b] md:block">
                Grass
              </span>
            </Link>

            {renderSearchBox("Search for plants...")}

            <nav className="hidden items-center gap-2 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeOverlays}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
                    pathname === link.href ? "bg-[#24361b] text-white" : "text-[#214f14]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((open) => !open)}
                className="p-2 md:hidden"
                aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              >
                {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              <Link href="/order" className="relative p-2" aria-label="View wishlist">
                <Heart
                  size={20}
                  fill={wishlistCount > 0 ? "#008000" : "none"}
                  className="text-[#008000]"
                />
                {wishlistCount > 0 ? (
                  <span className="absolute right-0 top-0 h-4 w-4 rounded-full bg-[#008000] text-center text-[10px] text-white">
                    {wishlistCount}
                  </span>
                ) : null}
              </Link>

              <Link href="/cart" className="p-2" aria-label="View cart">
                <ShoppingCart size={20} />
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="p-2 md:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {mobileSearchOpen ? renderSearchBox("Search...", true) : null}

          {menuOpen ? (
            <div className="theme-panel-strong mt-3 rounded-[1.4rem] p-2 md:hidden">
              <div className="flex flex-col gap-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeOverlays}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#214f14] hover:bg-[#edf2e7]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </header>
    </div>
  );
}