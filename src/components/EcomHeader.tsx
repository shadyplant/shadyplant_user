"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCartCount, useCartItems } from "@/components/cartStore";
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";
import { useProductsStore } from "@/components/productsStore";
import { useWishlistItems } from "@/components/wishlistStore";
import { formatDeliveryAddress } from "@/lib/deliveryAddress";
import { getProductHref } from "@/lib/productUrls";

const navLinks = [{ label: "Orders", href: "/order" }];
const flashSaleMessages = [
  "Off on ₹700+",
  "Up to 50% Off + Surprise Gifts",
  "First Order: Get Extra 10% Off on ₹700+",
  "Fresh nursery picks at flash-sale pricing",
] as const;

const stickyHeaderClass = "border-b border-[#e5ece0] bg-white";

type Suggestion = {
  label: string;
  meta: string;
  href: string;
};

export default function EcomHeader({
  initialDeliveryAddress = "",
}: {
  initialDeliveryAddress?: string;
}) {
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
  const savedDeliveryAddress =
    formatDeliveryAddress(user?.deliveryAddress) || initialDeliveryAddress;

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
        href: getProductHref(product),
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
        className={`${
          mobile ? "mt-3 md:hidden" : "hidden w-full md:flex md:justify-center"
        }`}
      >
        <div
          className={`relative ${
            mobile ? "w-full" : "w-full max-w-[420px] xl:max-w-[520px]"
          }`}
        >
          <form
            onSubmit={submitSearch}
            className={
              mobile
                ? "flex items-center gap-2 rounded-[0.5rem] bg-[#f2f2f2] px-3 py-1.5"
                : "flex w-full items-center gap-2 rounded-[0.5rem] bg-[#f2f2f2] px-4 py-1.5"
            }
          >
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setIsSearchFocused(false), 150);
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-[#221f1d] outline-none placeholder:text-[#5f5a57]"
            />
            <button
              type="submit"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:bg-[#00402b20] hover:text-emerald-900"
              aria-label="Search products"
            >
              <Search size={18} />
            </button>
          </form>

          {showSuggestions ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#d7dfd2] bg-white shadow-xl">
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
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50">
      <div className="overflow-hidden bg-[linear-gradient(90deg,#ff5a3d_0%,#ff7a22_52%,#ff9f1c_100%)] py-2.5 shadow-[0_8px_20px_rgba(255,106,43,0.28)]">
        <div className="flash-sale-marquee">
          {[0, 1].map((groupIndex) => (
            <div
              key={groupIndex}
              className="flash-sale-marquee-group"
              aria-hidden={groupIndex === 1}
            >
              {flashSaleMessages.map((message) => (
                <span
                  key={`${groupIndex}-${message}`}
                  className="flash-sale-marquee-item"
                >
                  {message}
                  <span className="flash-sale-marquee-separator">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header className={stickyHeaderClass}>
        <div className="mx-auto max-w-7xl px-4 py-2.5 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image
                src="/ggn-logo2.svg"
                alt="Grass Green Nursery"
                width={188}
                height={54}
                priority
                className="h-10 w-auto md:h-13"
              />
              <span className="sr-only">Grass Green Nursery</span>
            </Link>

            <div className="min-w-0 md:flex md:justify-center">
              {renderSearchBox("Search for plants...")}
            </div>

            <div className="flex items-center justify-self-end gap-1 md:gap-2">
              <nav className="hidden items-center gap-2 lg:flex">
                <ProductDeliveryAddressPicker
                  variant="header-inline"
                  initialAddress={savedDeliveryAddress}
                  emptyLabel="Set your Location"
                />
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

              <button
                type="button"
                onClick={() => setMobileSearchOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center md:hidden"
                aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              >
                {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              <Link
                href={isAuthenticated ? "/profile" : "/auth?next=/profile"}
                className="relative hidden p-2 md:inline-flex"
                aria-label={isAuthenticated ? "View profile" : "Sign in"}
              >
                <UserRound size={20} className="text-[#214f14]" />
              </Link>

              <Link
                href={wishlistHref}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  pathname === "/wishlist"
                    ? "bg-[#edf5e1] text-[#214f14]"
                    : "text-[#214f14] hover:bg-[#edf5e1]"
                }`}
                aria-label="View wishlist"
              >
                <span className="relative inline-flex">
                  <Heart
                    size={20}
                    fill={wishlistCount > 0 ? "currentColor" : "none"}
                  />
                  {wishlistCount > 0 ? (
                    <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#008000] text-center text-[10px] leading-4 text-white">
                      {wishlistCount}
                    </span>
                  ) : null}
                </span>
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
                className="flex h-10 w-10 items-center justify-center md:hidden"
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
