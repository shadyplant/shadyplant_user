"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ShoppingCart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCartCount, useCartItems } from "@/components/cartStore";

type MobileSearchHeaderProps = {
  initialQuery?: string;
  sticky?: boolean;
  onSearch?: (query: string) => void;
};

export default function MobileSearchHeader({
  initialQuery = "",
  sticky = true,
  onSearch,
}: MobileSearchHeaderProps) {
  const [searchInput, setSearchInput] = useState(initialQuery);
  const router = useRouter();
  const cartItems = useCartItems();
  const cartCount = getCartCount(cartItems);
  const displayCartCount = cartCount > 99 ? "99+" : String(cartCount);
  const cartHref = "/cart";

  useEffect(() => {
    setSearchInput(initialQuery);
  }, [initialQuery]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (onSearch) {
      onSearch(searchInput);
      return;
    }

    const trimmedSearch = searchInput.trim();

    router.push(
      trimmedSearch
        ? `/search?q=${encodeURIComponent(trimmedSearch)}`
        : "/search",
    );
  }

  return (
    <div
      className={`border-b border-[#e4ebdf] bg-white/95 backdrop-blur md:hidden ${
        sticky ? "sticky top-0 z-50" : ""
      }`}
    >
      <div className="flex min-h-[68px] items-center gap-2 px-3 py-2.5">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-700 transition hover:bg-gray-300"
          aria-label="Go back"
        >
          <ArrowLeft size={22} strokeWidth={1.9} />
        </button>

        {/* Search */}
        <form
          onSubmit={submitSearch}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md border border-gray-300 px-4 py-2 shadow-[0_4px_14px_rgba(28,45,20,0.05)]"
        >
          <Search
            size={18}
            strokeWidth={2}
            className="shrink-0 text-gray-500"
          />

          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search for products"
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-gray-700 outline-none placeholder:text-gray-500 md:text-base"
          />

          {searchInput.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </form>

        {/* Cart */}
        <Link
          href={cartHref}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center text-gray-700 transition hover:bg-gray-300"
          aria-label="View cart"
        >
          <ShoppingCart size={21} strokeWidth={1.9} />

          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#207958] px-1 text-center text-[7px] leading-4 text-white">
              {displayCartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
