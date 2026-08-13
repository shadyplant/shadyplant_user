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
  const savedAddress =
    formatDeliveryAddress(user?.deliveryAddress) || initialAddress;

  return (
    <div className="grid grid-cols-2 gap-2 px-2 md:mx-6 mt-4">
      <ProductDeliveryAddressPicker
        variant="home-strip"
        initialAddress={savedAddress}
        emptyLabel="Enter your delivery point"
      />

      <Link
        href="/lawn-grass"
        className="flex items-center justify-between gap-2 rounded-[0.5rem] border-[1.5px] border-gray-200 bg-white px-2 py-2 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition hover:border-[#d7c0b0] hover:bg-[#fffbf8]"
        aria-label="Open lawn calculator"
      >
        <span className="flex h-8 w-8 rounded-md bg-gray-100 shrink-0 items-center justify-center text-[#c46a3f]">
          <img
            src="https://m.media-amazon.com/images/I/51CpNmfRVkL._AC_UF1000,1000_QL80_.jpg"
            alt="Lawn calculator icon"
            className="h-8 w-8 rounded-md object-cover"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-[#171410]">
            Lawn Grass
          </span>
          <span className="block text-[9px] text-[#7a7a7a]">
            Get your lawn estimate
          </span>
        </span>

        <ChevronRight size={16} className="shrink-0 text-[#9a9a9a]" />
      </Link>
    </div>
  );
}
