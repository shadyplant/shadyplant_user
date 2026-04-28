"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCartCount, useCartItems } from "@/components/cartStore";
import { useProductsStore } from "@/components/productsStore";
import { useWishlistItems } from "@/components/wishlistStore";

const navLinks = [{ label: "Orders", href: "/order" }];

const stickyHeaderClass =
  "border-b border-white/20 bg-[rgba(248,251,246,0.84)] [box-shadow:0_6px_16px_-4px_rgba(36,54,27,0.12)] backdrop-blur-2xl backdrop-saturate-150";

type Suggestion = {
  label: string;
  meta: string;
  href: string;
};

export default function EcomHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const cartItems = useCartItems();
  const wishlistItems = useWishlistItems();
  const { products } = useProductsStore();
  const cartCount = getCartCount(cartItems);
  const wishlistCount = wishlistItems.length;
  const wishlistHref = isAuthenticated ? "/wishlist" : "/auth?next=/wishlist";
  const cartHref = isAuthenticated ? "/cart" : "/auth?next=/cart";

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const suggestions = useMemo<Suggestion[]>(() => {
    if (!normalizedSearch) {
      return [];
    }

    return products
      .filter((product) =>
        [
          product.name,
          product.category,
          product.badge,
          product.description,
        ].some((value) => value.toLowerCase().includes(normalizedSearch)),
      )
      .map((product) => ({
        label: product.name,
        meta: `${product.category} - ${product.price}`,
        href: `/products/${product.id}`,
      }))
      .slice(0, 6);
  }, [normalizedSearch, products]);

  const showSuggestions = isSearchFocused && suggestions.length > 0;

  function closeOverlays() {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setIsSearchFocused(false);
  }

  async function handleLogout() {
    await logout();
    closeOverlays();
    router.push("/auth");
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeOverlays();

    const trimmedSearch = searchTerm.trim();

    if (!trimmedSearch) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmedSearch)}`);
  }

  function renderSearchBox(placeholder: string, mobile = false) {
    return (
      <div
        className={`relative ${
          mobile
            ? "mt-3 md:hidden"
            : "hidden flex-1 md:flex md:min-w-[340px] lg:min-w-[460px] xl:min-w-[560px]"
        }`}
      >
        <form
          onSubmit={submitSearch}
          className={
            mobile
              ? "flex items-center gap-2 rounded-xl border border-[#d9e4d5] bg-white/65 px-3 py-2.5"
              : "theme-input flex w-full items-center gap-3 rounded-xl border border-[#24361b]/10 bg-white/65 px-4 py-2.5 lg:max-w-[560px] xl:max-w-[680px]"
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
          <button
            type="submit"
            className="rounded-full bg-[#214f14] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#163915]"
          >
            Go
          </button>
        </form>

        {showSuggestions ? (
          <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[#d7dfd2] bg-white shadow-xl">
            <div className="p-2">
              <Link
                href={
                  normalizedSearch
                    ? `/search?q=${encodeURIComponent(searchTerm.trim())}`
                    : "/search"
                }
                onClick={closeOverlays}
                className="mb-2 flex items-center justify-between rounded-2xl bg-[#f4f8ef] px-3 py-3 transition-colors hover:bg-[#ebf3e2]"
              >
                <div>
                  <p className="text-sm font-semibold text-[#173d12]">
                    View all search results
                  </p>
                  <p className="text-xs text-[#6b8b58]">
                    Open filtered results for &quot;{searchTerm.trim()}&quot;
                  </p>
                </div>
              </Link>

              {suggestions.map((suggestion) => (
                <Link
                  key={`${suggestion.meta}-${suggestion.label}`}
                  href={suggestion.href}
                  onClick={closeOverlays}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-[#f4f8ef]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#173d12]">
                      {suggestion.label}
                    </p>
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
                    pathname === link.href
                      ? "bg-[#24361b] text-white"
                      : "text-[#214f14]"
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

              <Link
                href={wishlistHref}
                className="relative hidden p-2 md:inline-flex"
                aria-label="View wishlist"
              >
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

              <Link
                href={isAuthenticated ? "/profile" : "/auth?next=/profile"}
                className={`rounded-full p-2 transition-colors ${
                  pathname === "/profile"
                    ? "bg-[#edf5e1] text-[#214f14]"
                    : "text-[#214f14] hover:bg-[#edf5e1]"
                }`}
                aria-label={isAuthenticated ? "View profile" : "Sign in"}
              >
                <UserRound size={20} />
              </Link>

              {!isAuthenticated ? (
                <Link
                  href="/auth?next=/profile"
                  className="hidden rounded-full bg-[#214f14] px-4 py-2 text-sm font-semibold text-white md:inline-flex"
                >
                  Sign In
                </Link>
              ) : null}

              <Link
                href={cartHref}
                className="relative hidden p-2 md:inline-flex"
                aria-label="View cart"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 ? (
                  <span className="absolute right-0 top-0 h-4 min-w-4 rounded-full bg-[#214f14] px-1 text-center text-[10px] leading-4 text-white">
                    {cartCount}
                  </span>
                ) : null}
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

                <Link
                  href={isAuthenticated ? "/profile" : "/auth?next=/profile"}
                  onClick={closeOverlays}
                  className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#214f14] hover:bg-[#edf2e7]"
                >
                  {isAuthenticated
                    ? `Account${user?.fullName ? ` - ${user.fullName.split(" ")[0]}` : ""}`
                    : "Sign In"}
                </Link>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-[#c54b4b] hover:bg-[#fff5f5]"
                  >
                    Logout
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </header>
    </div>
  );
}
