"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";
import { formatDeliveryAddress } from "@/lib/deliveryAddress";
import Link from "next/link";
import { ChevronRight, MapPin, Ruler } from "lucide-react";

export default function HomeLocationStrip({
  initialAddress = "",
}: {
  initialAddress?: string;
}) {
  const { user } = useAuth();
  const savedAddress = formatDeliveryAddress(user?.deliveryAddress) || initialAddress;

  return (
    <div className="mx-1 grid grid-cols-2 gap-2 px-2 md:mx-6 mt-4">
      <ProductDeliveryAddressPicker
        variant="home-strip"
        initialAddress={savedAddress}
        emptyLabel="Enter your delivery point"
      />

      <Link
        href="/lawn-grass"
        className="flex items-center justify-between gap-3 rounded-[0.5rem] border border-[#e8ddd6] bg-white px-2 py-1 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition hover:border-[#d7c0b0] hover:bg-[#fffbf8]"
        aria-label="Open lawn calculator"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#c46a3f]">
          <Ruler size={18} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold leading-5 text-[#171410]">
            Lawn calculator
          </span>
          <span className="mt-0.5 block text-[10px] leading-4 text-[#7a7a7a]">
            Get your lawn estimate
          </span>
        </span>

        <ChevronRight  size={16} className="shrink-0 text-[#9a9a9a]"  />
      </Link>
    </div>
  );
}
