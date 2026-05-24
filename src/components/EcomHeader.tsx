"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Crown,
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCartCount, useCartItems } from "@/components/cartStore";
import ProductDeliveryAddressPicker, {
  DELIVERY_ADDRESS_EVENT,
} from "@/components/ProductDeliveryAddressPicker";
import { useProductsStore } from "@/components/productsStore";
import { formatDeliveryAddress } from "@/lib/deliveryAddress";
import { getProductHref } from "@/lib/productUrls";

const TOP_OFFER_MARQUEE_IS_ANIMATED = false;

const flashSaleMessages = [
  "Off on ₹700+",
  "Up to 50% Off + Surprise Gifts",
  "First Order: Get Extra 10% Off on ₹700+",
  "Fresh nursery picks at flash-sale pricing",
] as const;

const animatedSearchPlaceholders = [
  "Search for Areca Palm",
  "Search for Snake Plant Laurentii",
  "Search for Red Hibiscus",
  "Search for Korean Lawn Grass",
] as const;

const stickyHeaderClass = "border-b border-[#e5ece0] bg-white";

type Suggestion = {
  label: string;
  meta: string;
  href: string;
};

function formatCollectionLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function EcomHeader({
  initialDeliveryAddress = "",
}: {
  initialDeliveryAddress?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();

  // Main States
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [liveDeliveryAddress, setLiveDeliveryAddress] = useState("");

  // Smooth Typing Animation States
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [pauseAtEnd, setPauseAtEnd] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(88);
  const [isHeaderPinned, setIsHeaderPinned] = useState(false);
  const headerRootRef = useRef<HTMLDivElement | null>(null);
  const flashSaleRef = useRef<HTMLDivElement | null>(null);

  const cartItems = useCartItems();
  const { products } = useProductsStore();

  const cartCount = getCartCount(cartItems);
  const displayCartCount = cartCount > 99 ? "99+" : String(cartCount);

  const wishlistHref = isAuthenticated ? "/wishlist" : "/auth?next=/wishlist";
  const cartHref = "/cart";
  const savedDeliveryAddress =
    formatDeliveryAddress(user?.deliveryAddress) || initialDeliveryAddress;
  const headerDeliveryAddress = liveDeliveryAddress || savedDeliveryAddress;

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!normalizedSearch) return [];

    return products
      .filter((product) =>
        [
          product.name,
          product.category,
          product.badge,
          product.description,
        ].some((value) => value.toLowerCase().includes(normalizedSearch))
      )
      .map((product) => ({
        label: product.name,
        meta: `${product.category} - ${product.price}`,
        href: getProductHref(product),
      }))
      .slice(0, 6);
  }, [normalizedSearch, products]);

  const collectionLinks = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((product) => String(product.category || "").trim())
          .filter(Boolean),
      ),
    );

    return uniqueCategories.slice(0, 6).map((category) => ({
      label: formatCollectionLabel(category),
      href: `/search?category=${encodeURIComponent(category)}`,
    }));
  }, [products]);

  const showSuggestions = isSearchFocused && suggestions.length > 0;

  // ==================== SMOOTH TYPING ANIMATION ====================
  useEffect(() => {
    if (searchTerm.trim()) {
      setTypedPlaceholder("");
      return;
    }

    const currentText = animatedSearchPlaceholders[placeholderIndex];
    let timeout: NodeJS.Timeout;

    // Cursor blinking
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    if (pauseAtEnd) {
      timeout = setTimeout(() => {
        setPauseAtEnd(false);
        setIsDeleting(true);
      }, 1350);
    } else if (isDeleting) {
      if (typedPlaceholder.length > 0) {
        timeout = setTimeout(() => {
          setTypedPlaceholder((prev) => prev.slice(0, -1));
        }, 35 + Math.random() * 25); // Natural delete speed
      } else {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % animatedSearchPlaceholders.length);
      }
    } else {
      if (typedPlaceholder.length < currentText.length) {
        timeout = setTimeout(() => {
          setTypedPlaceholder(currentText.slice(0, typedPlaceholder.length + 1));
        }, 60 + Math.random() * 50); // Natural typing variation
      } else {
        setPauseAtEnd(true);
      }
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(cursorInterval);
    };
  }, [typedPlaceholder, placeholderIndex, isDeleting, pauseAtEnd, searchTerm]);

  useEffect(() => {
    setLiveDeliveryAddress(savedDeliveryAddress);
  }, [savedDeliveryAddress]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleDeliveryAddressUpdate(event: Event) {
      const nextAddress =
        event instanceof CustomEvent &&
        event.detail &&
        typeof event.detail.address === "string"
          ? event.detail.address
          : "";

      setLiveDeliveryAddress(nextAddress);
    }

    window.addEventListener(
      DELIVERY_ADDRESS_EVENT,
      handleDeliveryAddressUpdate,
    );

    return () => {
      window.removeEventListener(
        DELIVERY_ADDRESS_EVENT,
        handleDeliveryAddressUpdate,
      );
    };
  }, []);

  useEffect(() => {
    const headerElement = headerRootRef.current;
    const flashSaleElement = flashSaleRef.current;

    if (!headerElement) {
      return;
    }

    const updateMeasurements = () => {
      setHeaderHeight(headerElement.getBoundingClientRect().height);

      const flashSaleHeight = flashSaleElement?.getBoundingClientRect().height || 0;
      setIsHeaderPinned(window.scrollY > flashSaleHeight);
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    resizeObserver.observe(headerElement);
    if (flashSaleElement) {
      resizeObserver.observe(flashSaleElement);
    }

    window.addEventListener("resize", updateMeasurements);
    window.addEventListener("scroll", updateMeasurements, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMeasurements);
      window.removeEventListener("scroll", updateMeasurements);
    };
  }, [menuOpen, mobileSearchOpen]);

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

  function renderSearchBox(defaultPlaceholder: string, mobile = false) {
    const baseText = mobile || searchTerm.trim() ? defaultPlaceholder : typedPlaceholder;
    const cursor = !searchTerm.trim() && baseText ? (showCursor ? " |" : "  ") : "";
    const displayText = baseText + cursor;

    return (
      <div
        className={`${
          mobile ? "mt-3 md:hidden" : "hidden w-full md:flex md:justify-center"
        }`}
      >
        <div
          className={`relative ${
            mobile ? "w-full" : "w-full md:w-[78%] xl:w-[84%]"
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
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setIsSearchFocused(false), 150);
              }}
              placeholder={displayText}
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

          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#d7dfd2] bg-white shadow-xl">
              <div className="p-2">
                <Link
                  href={`/search?q=${encodeURIComponent(searchTerm.trim())}`}
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
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Flash Sale Banner */}
      <div
        ref={flashSaleRef}
        className="overflow-hidden bg-[linear-gradient(90deg,#ff5a3d_0%,#ff7a22_52%,#ff9f1c_100%)] py-2.5 shadow-[0_8px_20px_rgba(255,106,43,0.28)]"
      >
        <div
          className={`flex min-w-full will-change-transform ${
            TOP_OFFER_MARQUEE_IS_ANIMATED
              ? "animate-[flash-sale-marquee_24s_linear_infinite] hover:[animation-play-state:paused]"
              : "w-full justify-center"
          }`}
          style={{ width: TOP_OFFER_MARQUEE_IS_ANIMATED ? "max-content" : undefined }}
        >
          {(TOP_OFFER_MARQUEE_IS_ANIMATED ? [0, 1] : [0]).map((groupIndex) => (
            <div
              key={groupIndex}
              className="flex shrink-0 items-center"
              aria-hidden={TOP_OFFER_MARQUEE_IS_ANIMATED && groupIndex === 1}
            >
              {flashSaleMessages.map((message) => (
                <span
                  key={`${groupIndex}-${message}`}
                  className="inline-flex shrink-0 items-center pl-5 text-[0.7rem] leading-none font-medium tracking-[0.01em] text-[#fff9f2] md:text-[0.9rem]"
                >
                  {message}
                  <span className="ml-5 text-[0.75rem] text-[#fff1a8] md:text-[0.85rem]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={headerRootRef}
        className={`inset-x-0 z-50 w-full ${
          isHeaderPinned ? "fixed top-0" : "relative"
        }`}
      >
        <header className={stickyHeaderClass}>
          <div className="mx-auto max-w-7xl px-4 py-2.5 md:px-6 md:py-4">
            <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6">
              {/* Logo */}
              <Link href="/" className="flex shrink-0 items-center gap-2">
                <Image
                  src="/ggn-logo2.svg"
                  alt="Grass Green Nursery"
                  width={188}
                  height={54}
                  priority
                  className="h-8 w-auto md:h-10"
                />
                <span className="sr-only">Grass Green Nursery</span>
              </Link>

              {/* Desktop Search */}
              <div className="min-w-0 md:flex md:justify-center">
                {renderSearchBox("Search for plants...")}
              </div>

              {/* Right Section */}
              <div className="flex items-center justify-self-end gap-1.5 md:gap-2.5">
                <div className="hidden lg:block">
                  <div className=" bg-white px-1.5 py-1">
                    <ProductDeliveryAddressPicker
                      variant="header-inline"
                      initialAddress={headerDeliveryAddress}
                      emptyLabel="Set your Location"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileSearchOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center md:hidden"
                  aria-label={mobileSearchOpen ? "Close search" : "Open search"}
                >
                  {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
                </button>

                <Link
                  href={wishlistHref}
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-white transition-colors ${
                    pathname === "/wishlist"
                      ? "text-[#4c8b5d]"
                      : "text-[#8a857f] hover:bg-[#f7faf5] hover:text-[#4c8b5d]"
                  }`}
                  aria-label="View wishlist"
                >
                  <span className="relative inline-flex">
                    <Heart size={20} />
                  </span>
                </Link>

                <Link
                  href={cartHref}
                  className="relative hidden h-11 w-11 items-center justify-center rounded-full text-[#8a857f] transition hover:bg-[#f7faf5] hover:text-[#4c8b5d] md:inline-flex"
                  aria-label="View cart"
                >
                  <ShoppingCart size={21} />
                  {cartCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#75b35c] px-1 text-center text-[10px] leading-4 text-white">
                      {displayCartCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated && (
                  <div className="group relative hidden md:block">
                    <Link
                      href="/profile"
                      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
                        pathname === "/profile"
                          ? "text-[#4c8b5d]"
                          : "text-[#8a857f] hover:bg-[#f7faf5] hover:text-[#4c8b5d]"
                      }`}
                      aria-label="View profile"
                    >
                      <UserRound size={21}  />
                      {user?.isVip ? (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#f5edc4] text-[#7b5b08] shadow-sm">
                          <Crown size={10} fill="currentColor" />
                        </span>
                      ) : null}
                    </Link>

                    <div className="pointer-events-none invisible absolute right-0 top-full z-50 pt-3 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
                      <div className="min-w-[13rem] overflow-hidden rounded-[0.75rem] border border-[#d8e1d2] bg-white shadow-[0_18px_40px_rgba(23,61,18,0.12)]">
                        <Link
                          href="/profile"
                          onClick={closeOverlays}
                          className="flex items-center justify-center px-5 py-4 text-sm font-medium text-[#214f14] transition-colors hover:bg-[#f4f8ef]"
                        >
                          Profile
                        </Link>
                        <div className="border-t border-[#e6ede1]" />
                        <Link
                          href="/order"
                          onClick={closeOverlays}
                          className="flex items-center justify-center px-5 py-4 text-sm font-medium text-[#214f14] transition-colors hover:bg-[#f4f8ef]"
                        >
                          Orders
                        </Link>
                        <div className="border-t border-[#e6ede1]" />
                        <button
                          type="button"
                          onClick={() => void handleLogout()}
                          className="flex w-full items-center justify-center gap-2 px-5 py-4 text-sm font-medium text-[#c54b4b] transition-colors hover:bg-[#fff5f5]"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!isAuthenticated && (
                  <Link
                    href="/auth?next=/profile"
                    className="hidden items-center rounded-full bg-[#4c8b5d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c5738] md:inline-flex"
                  >
                    Sign In/up
                  </Link>
                )}

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

            {/* Mobile Search */}
            {mobileSearchOpen && renderSearchBox("Search...", true)}

          </div>
        </header>

        {menuOpen ? (
          <div className="fixed inset-0 z-[45] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-[86vw] max-w-[390px] flex-col overflow-hidden bg-white shadow-[-14px_0_34px_rgba(0,0,0,0.08)]">
            <div className="bg-[#045326] px-4 pb-5 pt-6 text-white">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center text-white"
                aria-label="Close navigation menu"
              >
                <X size={27} strokeWidth={1.8} />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="mt-2 text-center">
                <div className="flex justify-center">
                  <span className="inline-flex h-[72px] w-[72px] shrink-0 rounded-full bg-[#c8c8c8]" />
                </div>
                  <div className="mt-3 min-w-0">
                    <p className="truncate text-[0.92rem] font-semibold text-white">
                      {user?.fullName || "Account"}
                    </p>
                    <p className="mt-1 truncate text-[0.72rem] text-white/90">
                      {user?.email || user?.phoneNumber || ""}
                    </p>
                  </div>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="inline-flex h-12 items-center justify-center rounded-[0.55rem] border border-[#e2e2e2] bg-white text-[0.88rem] font-semibold text-[#c54b4b]"
                  >
                    Log Out
                  </button>
                  <Link
                    href="/profile"
                    onClick={closeOverlays}
                    className="inline-flex h-12 items-center justify-center rounded-[0.55rem] border border-white bg-transparent text-[0.88rem] font-semibold text-white"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-center">
                <div className="flex justify-center">
                  <span className="inline-flex h-[72px] w-[72px] shrink-0 rounded-full bg-[#c8c8c8]" />
                </div>
                  <div className="mt-3 min-w-0">
                    <p className="text-[0.92rem] font-semibold text-white">
                      Hello Dude!
                    </p>
                    <p className="mx-auto mt-1 max-w-[220px] text-[0.76rem] leading-5 text-white/90">
                      Create an account or log in to stay updated on your
                      orders and grab exclusive discounts.
                    </p>
                  </div>

                <Link
                  href="/auth?next=/profile"
                  onClick={closeOverlays}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[0.55rem] bg-white text-[0.88rem] font-semibold text-[#1d5d34]"
                >
                  Login / Signup
                </Link>
              </div>
            )}
            </div>

            <div className="px-4 pb-8 pt-14">
              <Link
                href="/search"
                onClick={closeOverlays}
                className="block text-[0.95rem] font-semibold text-[#222222]"
              >
                All Collection
              </Link>
              <div className="mt-2 h-px bg-[#2d2d2d]" />

              <div className="mt-3">
                {(collectionLinks.length
                  ? collectionLinks
                  : [
                      { label: "Best Selling", href: "/search" },
                      { label: "Indoor Plants", href: "/search" },
                      { label: "Saplings", href: "/search" },
                      { label: "Outdoor Plants", href: "/search" },
                    ]).map((collection) => (
                  <Link
                    key={collection.label}
                    href={collection.href}
                    onClick={closeOverlays}
                    className="block border-b border-[#cfcfcf] py-3 text-[0.88rem] text-[#777777]"
                  >
                    {collection.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
          </div>
        ) : null}

      </div>
      <div
        aria-hidden="true"
        style={{ height: isHeaderPinned ? `${headerHeight}px` : "0px" }}
      />
      <style>{`
        @keyframes flash-sale-marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </>
  );
}
