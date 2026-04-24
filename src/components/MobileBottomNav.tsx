"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2x2, Home, ShoppingCart, UserRound } from "lucide-react";

const items = [
  { label: "Home", href: "/", icon: Home },
  { label: "Categories", href: "/order", icon: Grid2x2 },
  { label: "Cart", href: "/cart", icon: ShoppingCart },
  { label: "Account", href: "/blogs", icon: UserRound },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d7dfd2] bg-white/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-4">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold ${
                active ? "text-[#24361b]" : "text-[#6f8167]"
              }`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
