"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PackageSearch, ShoppingCart, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCartCount, useCartItems } from "@/components/cartStore";

const items = [
  { label: "Home", href: "/", icon: Home },
  { label: "Orders", href: "/order", icon: PackageSearch },
  { label: "Cart", href: "/cart", icon: ShoppingCart },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const cartItems = useCartItems();
  const cartCount = getCartCount(cartItems);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d7dfd2] bg-white/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-4">
        {items.map(({ label, href, icon: Icon }) => {
          const resolvedHref =
            href === "/order" && !isAuthenticated
              ? "/auth?next=/order"
              : (href === "/cart" || href === "/profile") && !isAuthenticated
                ? `/auth?next=${href}`
                : href;
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={resolvedHref}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold ${
                active ? "text-[#24361b]" : "text-[#6f8167]"
              }`}
            >
              <span className="relative">
                <Icon size={19} />
                {href === "/cart" && cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#214f14] px-1 text-[10px] text-white">
                    {cartCount}
                  </span>
                ) : null}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
