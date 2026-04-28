"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { isValidPostalCode } from "@/lib/validation";

type ProductDeliveryCheckProps = {
  productName: string;
};

type DeliveryStatus =
  | {
      tone: "info";
      message: string;
      note: string;
    }
  | {
      tone: "success";
      message: string;
      note: string;
    }
  | {
      tone: "error";
      message: string;
      note: string;
    };

const DEFAULT_STATUS: DeliveryStatus = {
  tone: "info",
  message: "This product is eligible for FREE SHIPPING",
  note: "Enter your pincode to confirm serviceability and dispatch timing.",
};

export default function ProductDeliveryCheck({
  productName,
}: ProductDeliveryCheckProps) {
  const [postalCode, setPostalCode] = useState("");
  const [status, setStatus] = useState<DeliveryStatus>(DEFAULT_STATUS);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPostalCode = postalCode.trim();

    if (
      !/^[1-9][0-9]{5}$/.test(normalizedPostalCode) ||
      !isValidPostalCode(normalizedPostalCode)
    ) {
      setStatus({
        tone: "error",
        message: "Enter a valid pincode to check delivery details.",
        note: "Use a valid 6-digit pincode.",
      });
      return;
    }

    setPostalCode(normalizedPostalCode);
    setStatus({
      tone: "success",
      message: `Delivery available for ${normalizedPostalCode}. Free shipping included.`,
      note: `${productName} can be dispatched with healthy plant-safe packaging within 24 hours.`,
    });
  }

  const statusClasses =
    status.tone === "success"
      ? "border-[#d3e4c1] bg-[#edf6e2] text-[#214f14]"
      : status.tone === "error"
        ? "border-[#f0c6c6] bg-[#fff1f1] text-[#9f3636]"
        : "border-[#c9daf0] bg-[#dceafb] text-[#2d5e9f]";

  return (
    <div className="mt-8 border-t border-[#dce8ce] pt-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#163915]">
            Check for Delivery Details
          </h2>
          <p className="mt-1 text-sm text-[#6d8464]">
            Enter your pincode to confirm if delivery is available for this
            plant in your area.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="delivery-postal-code" className="sr-only">
              Enter pincode
            </label>
            <input
              id="delivery-postal-code"
              name="delivery-postal-code"
              type="text"
              value={postalCode}
              onChange={(event) =>
                setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              placeholder="Enter Pincode"
              className="h-14 w-full rounded-2xl border border-[#dce8ce] bg-white px-5 pr-28 text-base text-[#163915] outline-none transition placeholder:text-[#a0ac9a] focus:border-[#aac58d] focus:ring-2 focus:ring-[#dce8ce]"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 inline-flex h-10 items-center justify-center rounded-xl px-5 text-lg font-semibold text-[#2c6db3] transition hover:bg-[#eef4fc] hover:text-[#214f14]"
            >
              Check
            </button>
          </div>

          <div className={`rounded-2xl border px-4 py-4 ${statusClasses}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/65">
                <Truck size={18} />
              </span>
              <div>
                <p className="text-sm font-bold">{status.message}</p>
                <p className="mt-1 text-sm">{status.note}</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
