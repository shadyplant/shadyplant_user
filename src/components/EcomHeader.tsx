"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Crown,
  Bell,
  Heart,
  LogOut,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCartCount, useCartItems } from "@/components/cartStore";
import { useNotificationsStore } from "@/components/notifications/notificationsStore";
import { DELIVERY_ADDRESS_EVENT } from "@/components/ProductDeliveryAddressPicker";
import { useProductsStore } from "@/components/productsStore";
import { formatDeliveryAddress } from "@/lib/deliveryAddress";
import { readCheckoutDraft } from "@/lib/checkoutSession";
import { getProductHref } from "@/lib/productUrls";
import ProductDeliveryAddressPicker from "./ProductDeliveryAddressPicker";

const TOP_OFFER_MARQUEE_IS_ANIMATED = true;

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

const headerCategoryLinks = [
  { label: "Plants", href: "/search?category=Plants" },
  { label: "Seeds", href: "/search?category=Seeds" },
  { label: "Pots & Planters", href: "/search?category=Pots%20%26%20Planters" },
  { label: "Plant Care", href: "/search?category=Plant%20Care" },
  { label: "Gifting", href: "/search?category=Gifting" },
  { label: "Corporate Gifts", href: "/search?category=Corporate%20Gifts" },
  { label: "Garden Services", href: "/search?category=Garden%20Services" },
  { label: "Blog", href: "/blogs" },
  { label: "Offers", href: "/search?category=Offers" },
] as const;

const stickyHeaderClass = "border-b border-gray-200 bg-white";

type Suggestion = {
  label: string;
  meta: string;
  href: string;
};

type EcomHeaderProps = {
  initialDeliveryAddress?: string;
};

export default function EcomHeader({
  initialDeliveryAddress = "",
}: EcomHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();

  // Main States
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
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const cartItems = useCartItems();
  const { unreadCount: notificationUnreadCount } = useNotificationsStore();
  const { products } = useProductsStore();

  const cartCount = getCartCount(cartItems);
  const displayCartCount = cartCount > 99 ? "99+" : String(cartCount);
  const displayNotificationCount =
    notificationUnreadCount > 99 ? "99+" : String(notificationUnreadCount);

  const wishlistHref = isAuthenticated ? "/wishlist" : "/auth?next=/wishlist";
  const cartHref = "/cart";
  const latestCheckoutDraft = readCheckoutDraft();
  const savedDeliveryAddress =
    formatDeliveryAddress(user?.deliveryAddress) || "";
  const headerDeliveryAddress =
    liveDeliveryAddress ||
    latestCheckoutDraft?.deliveryAddress ||
    savedDeliveryAddress ||
    initialDeliveryAddress;

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

  // ==================== SMOOTH TYPING ANIMATION ====================
  useEffect(() => {
    if (searchTerm.trim()) {
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
        timeout = setTimeout(
          () => {
            setTypedPlaceholder((prev) => prev.slice(0, -1));
          },
          35 + Math.random() * 25,
        ); // Natural delete speed
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setPlaceholderIndex(
            (prev) => (prev + 1) % animatedSearchPlaceholders.length,
          );
        }, 0);
      }
    } else {
      if (typedPlaceholder.length < currentText.length) {
        timeout = setTimeout(
          () => {
            setTypedPlaceholder(
              currentText.slice(0, typedPlaceholder.length + 1),
            );
          },
          60 + Math.random() * 50,
        ); // Natural typing variation
      } else {
        timeout = setTimeout(() => {
          setPauseAtEnd(true);
        }, 0);
      }
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(cursorInterval);
    };
  }, [typedPlaceholder, placeholderIndex, isDeleting, pauseAtEnd, searchTerm]);

  useEffect(() => {
    const resetOverlayState = window.setTimeout(() => {
      setMobileSearchOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(resetOverlayState);
    };
  }, [pathname]);

  useEffect(() => {
    if (!mobileSearchOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      mobileSearchInputRef.current?.focus();
    });
  }, [mobileSearchOpen]);

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

      const flashSaleHeight =
        flashSaleElement?.getBoundingClientRect().height || 0;
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
  }, [mobileSearchOpen]);

  function closeOverlays() {
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
    const baseText =
      mobile || searchTerm.trim() ? defaultPlaceholder : typedPlaceholder;
    const cursor =
      !searchTerm.trim() && baseText ? (showCursor ? " |" : "  ") : "";
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
              ref={mobile ? mobileSearchInputRef : undefined}
              type="text"
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
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="p-2">
                <Link
                  href={`/search?q=${encodeURIComponent(searchTerm.trim())}`}
                  onClick={closeOverlays}
                  className="mb-2 flex items-center justify-between rounded-md bg-gray-100 px-3 py-3 transition-colors hover:bg-gray-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      View all search results
                    </p>
                    <p className="text-xs text-gray-600">
                      Open filtered results for &quot;{searchTerm.trim()}&quot;
                    </p>
                  </div>
                </Link>

                {suggestions.map((suggestion) => (
                  <Link
                    key={`${suggestion.meta}-${suggestion.label}`}
                    href={suggestion.href}
                    onClick={closeOverlays}
                    className="flex items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-gray-100"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {suggestion.label}
                      </p>
                      <p className="text-xs text-gray-600">{suggestion.meta}</p>
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
        className="overflow-hidden bg-[linear-gradient(90deg,#06331F_0%,#012D1D_52%,#012D1D_100%)] py-2.5 shadow-[0_8px_20px_rgba(255,106,43,0.28)]"
      >
        <div
          className={`flex min-w-full will-change-transform ${
            TOP_OFFER_MARQUEE_IS_ANIMATED
              ? "animate-[flash-sale-marquee_24s_linear_infinite] hover:[animation-play-state:paused]"
              : "w-full justify-center"
          }`}
          style={{
            width: TOP_OFFER_MARQUEE_IS_ANIMATED ? "max-content" : undefined,
          }}
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
                  <span className="ml-5 text-[0.75rem] text-[#fff1a8] md:text-[0.85rem]">
                    ✦
                  </span>
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
          <div className="mx-auto max-w-7xl px-2 py-1.5 md:px-6 md:py-4">
            <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6">
              {/* Logo */}
              <Link href="/" className="flex shrink-0 items-center gap-2">
                <Image
                  src="/ggn-logo2.svg"
                  alt="ShadyPlant"
                  width={188}
                  height={54}
                  priority
                  className="h-8 w-auto md:h-10 pl-2"
                />
                <span className="sr-only">ShadyPlant</span>
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-500 md:hidden"
                  aria-label={mobileSearchOpen ? "Close search" : "Open search"}
                >
                  {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
                </button>

                <Link
                  href="/notification"
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-[#f7faf5] hover:text-[#4c8b5d] md:hidden"
                  aria-label="View notifications"
                >
                  <Bell size={21} strokeWidth={2.1} />
                  {notificationUnreadCount > 0 ? (
                    <span className="absolute right-0 top-2 inline-flex h-4 min-w-4 -translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full bg-[#FF3B30] px-1 text-center text-[7px] leading-4 text-white">
                      {displayNotificationCount}
                    </span>
                  ) : null}
                </Link>

                <Link
                  href={cartHref}
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-[#f7faf5] hover:text-[#4c8b5d] md:hidden"
                  aria-label="View cart"
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#207958] px-1 text-center text-[7px] leading-4 text-white">
                      {displayCartCount}
                    </span>
                  )}
                </Link>

                <Link
                  href={wishlistHref}
                  className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white transition-colors md:flex ${
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
                  href="/notification"
                  className={`relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white transition-colors md:flex ${
                    pathname === "/notification"
                      ? "text-[#4c8b5d]"
                      : "text-[#8a857f] hover:bg-[#f7faf5] hover:text-[#4c8b5d]"
                  }`}
                  aria-label="View notifications"
                >
                  <Bell size={21} strokeWidth={2.1} />
                  {notificationUnreadCount > 0 ? (
                    <span className="absolute right-[-3px] top-[3px] inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3B30] px-1 text-center text-[10px] leading-4 text-white">
                      {displayNotificationCount}
                    </span>
                  ) : null}
                </Link>

                <Link
                  href={cartHref}
                  className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#8a857f] transition hover:bg-[#f7faf5] hover:text-[#4c8b5d] md:inline-flex"
                  aria-label="View cart"
                >
                  <ShoppingCart size={21} />
                  {cartCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4c8b5d] px-1 text-center text-[10px] leading-4 text-white">
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
                      <UserRound size={21} />
                      {user?.isVip ? (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#f5edc4] text-[#7b5b08] shadow-sm">
                          <Crown size={10} fill="currentColor" />
                        </span>
                      ) : null}
                    </Link>

                    <div className="pointer-events-none invisible absolute right-0 top-full z-50 pt-3 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
                      <div className="min-w-[13rem] overflow-hidden rounded-[0.75rem] border border-gray-300 bg-white shadow-[0_18px_40px_rgba(23,61,18,0.12)]">
                        <Link
                          href="/profile"
                          onClick={closeOverlays}
                          className="flex items-center justify-center px-5 py-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          Profile
                        </Link>
                        <div className="border-t border-gray-300" />
                        <Link
                          href="/order"
                          onClick={closeOverlays}
                          className="flex items-center justify-center px-5 py-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          Orders
                        </Link>
                        <div className="border-t border-gray-300" />
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
                    className="hidden items-center rounded-full bg-[#207958] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#46a780] md:inline-flex"
                  >
                    Sign In/up
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Search */}
            {mobileSearchOpen && renderSearchBox("Search...", true)}

            <div className="mt-3 hidden md:block">
              <div className="flex items-center justify-center gap-2 overflow-x-auto pt-2.5">
                {headerCategoryLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group relative whitespace-nowrap px-3 py-1.5 text-[0.76rem] uppercase text-gray-500 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.03] hover:text-[#173d12] lg:px-4 sm:text-sm"
                  >
                    <span className="relative z-10">{item.label}</span>

                    <span className="absolute bottom-0 left-0 h-[1px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#207958] to-[#173d12] transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>
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
