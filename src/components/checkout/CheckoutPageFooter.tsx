"use client";

import { Headphones, Lock, RefreshCw, ShieldCheck } from "lucide-react";

const paymentMethods = [
  {
    name: "PhonePe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="#5f259f" />
        <text x="16" y="21" fontSize="9" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">PhonePe</text>
      </svg>
    ),
  },
  {
    name: "Google Pay",
    icon: (
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="#fff" />
        <text x="8" y="14" fontSize="7" fill="#4285F4" fontFamily="sans-serif" fontWeight="700">G</text>
        <text x="13" y="14" fontSize="7" fill="#EA4335" fontFamily="sans-serif" fontWeight="700">o</text>
        <text x="17" y="14" fontSize="7" fill="#FBBC05" fontFamily="sans-serif" fontWeight="700">o</text>
        <text x="21" y="14" fontSize="7" fill="#4285F4" fontFamily="sans-serif" fontWeight="700">g</text>
        <text x="10" y="23" fontSize="7" fill="#34A853" fontFamily="sans-serif" fontWeight="700">Pay</text>
      </svg>
    ),
  },
  {
    name: "Paytm",
    icon: (
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="#00BAF2" />
        <text x="16" y="21" fontSize="9" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="800">Paytm</text>
      </svg>
    ),
  },
  {
    name: "Visa / MC",
    icon: (
      <svg width="28" height="18" viewBox="0 0 46 30" fill="none" aria-hidden="true">
        <rect width="46" height="30" rx="4" fill="#1A1F71" />
        <circle cx="14" cy="15" r="7" fill="#EB001B" />
        <circle cx="32" cy="15" r="7" fill="#F7B600" />
        <path d="M23 9.5a7 7 0 0 1 0 11 7 7 0 0 1 0-11z" fill="#FF5F00" />
      </svg>
    ),
  },
  {
    name: "Amex",
    icon: (
      <svg width="22" height="18" viewBox="0 0 36 24" fill="none" aria-hidden="true">
        <rect width="36" height="24" rx="4" fill="#016FD0" />
        <text x="18" y="16" fontSize="8" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">AMEX</text>
      </svg>
    ),
  },
  {
    name: "RuPay",
    icon: (
      <svg width="22" height="18" viewBox="0 0 36 24" fill="none" aria-hidden="true">
        <rect width="36" height="24" rx="4" fill="#f5f5f5" stroke="#ddd" strokeWidth="0.5" />
        <rect x="0" y="8" width="36" height="8" fill="#E31837" />
        <text x="18" y="15" fontSize="5.5" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">RuPay</text>
      </svg>
    ),
  },
  {
    name: "Net Banking",
    icon: (
      <svg width="22" height="18" viewBox="0 0 36 24" fill="none" aria-hidden="true">
        <rect width="36" height="24" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5" />
        <text x="18" y="10" fontSize="5" fill="#444" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">NET</text>
        <text x="18" y="17" fontSize="5" fill="#444" textAnchor="middle" fontFamily="sans-serif" fontWeight="600">BANKING</text>
      </svg>
    ),
  },
];

const trustItems = [
  { icon: Lock, label: "SSL Encrypted" },
  { icon: ShieldCheck, label: "PCI DSS Compliant" },
  { icon: RefreshCw, label: "Easy Returns" },
  { icon: Headphones, label: "24/7 Support" },
];

export default function CheckoutPageFooter() {
  return (
    <footer className="mx-auto mt-10 w-full max-w-7xl border-t border-[#e8ece3] pt-8 pb-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a8a6a]">
        Secure Payment Methods
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {paymentMethods.map(({ name, icon }) => (
          <span
            key={name}
            className="inline-flex items-center gap-2 rounded-[10px] border border-[#d7dccf] bg-white px-3.5 py-1.5 text-sm font-medium text-[#1f2a18] shadow-none transition-colors hover:border-[#b0b8a6]"
          >
            {icon}
            {name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#d7dccf] bg-white px-3.5 py-1.5 text-xs font-medium text-[#7a8a6a]">
          More
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
        {trustItems.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-[#6a7a5a]">
            <Icon size={14} strokeWidth={2} />
            {label}
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] tracking-[0.04em] text-[#9aaa8a]">
        Copyright {"\u00A9"} ShadyPlant. All rights reserved.
      </p>
    </footer>
  );
}
