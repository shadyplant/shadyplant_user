"use client";

import { Headphones, Lock, RefreshCw, ShieldCheck } from "lucide-react";

const paymentMethods = [
  {
    name: "PhonePe",
    icon: "https://i0.wp.com/www.plansinfo.com/blog/wp-content/uploads/2018/01/phonepe-e1520537823958.png?fit=200%2C200&ssl=1",
  },
  {
    name: "Google Pay",
    icon: "https://img.icons8.com/color/512/google-pay.png",
  },
  {
    name: "Paytm",
    icon: "https://images.seeklogo.com/logo-png/50/1/paytm-logo-png_seeklogo-501241.png",
  },
  {
    name: "Debit/Credit Card",
    icon: "https://www.freepnglogos.com/uploads/mastercard-png/what-are-the-visa-and-mastercard-limited-acceptance-programs-8.png",
  },
  {
    name: "Net Banking",
    icon: "https://cdn-icons-png.flaticon.com/512/2655/2655001.png",
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
    <footer className="mx-auto mt-10 w-full max-w-7xl border-t border-gray-200 pt-8 pb-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">
        Secure Payment Methods
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {paymentMethods.map(({ name, icon }) => (
          <span
            key={name}
            className="inline-flex items-center gap-2 rounded-[10px] border border-gray-100 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-500 shadow-none transition-colors hover:border-[#b0b8a6]"
          >
            <img src={icon} alt={name} className="h-5 " />
            <span className="text-[11px] font-semibold">{name}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-100 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-500">
          More
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
        {trustItems.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] tracking-[0.04em] text-gray-400">
        Copyright {"\u00A9"} ShadyPlant. All rights reserved.
      </p>
    </footer>
  );
}
