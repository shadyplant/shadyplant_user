"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
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
  const { isAuthenticated } = useAuth();
  const cartItems = useCartItems();
  const cartCount = getCartCount(cartItems);
  const cartHref = isAuthenticated ? "/cart" : "/auth?next=/cart";

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
      className={`border-b border-[#e7e7e7] bg-white md:hidden ${
        sticky ? "sticky top-0 z-50" : ""
      }`}
    >
      <div className="flex h-[56px] items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-9 shrink-0 items-center justify-center text-[#111111]"
          aria-label="Go back"
        >
          <ArrowLeft size={25} strokeWidth={1.8} />
        </button>

        <form
          onSubmit={submitSearch}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[0.5rem] border border-[#a9a9a9] bg-white px-4 py-1.5"
        >
          <Search
            size={24}
            strokeWidth={1.7}
            className="shrink-0 text-[#111111]"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search for  products"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#222222] outline-none placeholder:text-[#a1a1a1]"
          />
        </form>

        <Link
          href={cartHref}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center text-[#111111]"
          aria-label="View cart"
        >
          <ShoppingCart size={24} strokeWidth={1.8} />
          {cartCount > 0 ? (
            <span className="absolute right-0 top-0 h-4 min-w-4 rounded-full bg-[#111111] px-1 text-center text-[10px] leading-4 text-white">
              {cartCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
