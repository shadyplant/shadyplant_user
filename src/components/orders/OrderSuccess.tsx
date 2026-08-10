"use client";

import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { CheckCircle2, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface OrderSuccessProps {
  orderNumber?: string;
  orderDate?: string;
  deliveryDate?: string;
  total?: string;
  isLoading?: boolean;

  primaryActionHref?: string;
  primaryActionLabel?: string;
  primaryActionOnClick?: () => void;

  secondaryActionHref?: string;
  secondaryActionLabel?: string;

  mobileRedirectCountdown?: number | null;

  showRedirectBadge?: boolean;
  redirectSeconds?: number;
}

export default function OrderSuccess({
  orderNumber,
  orderDate,
  deliveryDate,
  total,
  primaryActionHref,
  primaryActionLabel,
  primaryActionOnClick,
  secondaryActionHref,
  secondaryActionLabel,
  mobileRedirectCountdown,
  isLoading = false,
  showRedirectBadge,
  redirectSeconds,
}: OrderSuccessProps) {
  const fadeUpItem = {
    initial: { opacity: 0, y: 14, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const sharedOptions = {
      spread: 70,
      startVelocity: 40,
      gravity: 0.9,
      ticks: 220,
      scalar: 1.05,
      colors: [
        "#ff6b6b",
        "#ffd166",
        "#06d6a0",
        "#118ab2",
        "#7b61ff",
        "#ff8fab",
        "#ffffff",
        "#f4a261",
      ],
    };

    const fire = (
      particleRatio: number,
      options: Parameters<typeof confetti>[0],
    ) => {
      confetti({
        ...sharedOptions,
        ...options,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    fire(0.25, {
      spread: 50,
      startVelocity: 55,
      origin: { x: 0.5, y: 0.25 },
    });

    const burstOne = window.setTimeout(() => {
      fire(0.2, {
        spread: 75,
        origin: { x: 0.2, y: 0.35 },
      });

      fire(0.2, {
        spread: 75,
        origin: { x: 0.8, y: 0.35 },
      });
    }, 180);

    const burstTwo = window.setTimeout(() => {
      fire(0.18, {
        spread: 95,
        decay: 0.92,
        scalar: 0.95,
        origin: { x: 0.35, y: 0.25 },
      });

      fire(0.18, {
        spread: 95,
        decay: 0.92,
        scalar: 0.95,
        origin: { x: 0.65, y: 0.25 },
      });
    }, 420);

    return () => {
      window.clearTimeout(burstOne);
      window.clearTimeout(burstTwo);
    };
  }, [isLoading]);

  const rows = [
    { label: "Order Number :", value: orderNumber },
    { label: "Order Date :", value: orderDate },
    { label: "Expected Delivery Date :", value: deliveryDate },
    { label: "Total :", value: total },
  ];

  return (
    <div className="min-h-screen w-full bg-[#4a9e5c] px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16">
      <div className="relative mx-auto flex w-full max-w-[860px] flex-col items-center">
        {showRedirectBadge ? (
          <div className="fixed right-3 top-3 z-[70] sm:right-5 sm:top-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-[#214f14]/30 p-1 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-md">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center">
                <div>
                  <div className="text-[10px] font-semibold leading-none text-[#214f14]">
                    {redirectSeconds}s
                  </div>

                  <div className="mt-0.5 text-[8px] leading-none text-[#6d7d68]">
                    Auto
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading ? (
          <>
            <motion.div
              initial={{ scale: 0.45, opacity: 0 }}
              animate={{ scale: [0.45, 1.14, 1], opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
              className="relative mb-6 flex h-[72px] w-[72px] items-center justify-center sm:h-[84px] sm:w-[84px]"
            >
              <motion.span
                aria-hidden="true"
                initial={{ scale: 0.7, opacity: 0.35 }}
                animate={{ scale: 1.18, opacity: 0 }}
                transition={{ delay: 0.32, duration: 0.7, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-[#b8efae]"
              />
              <div className="absolute inset-1 rounded-full bg-[#dff6da]" />
              <CheckCircle2
                className="relative z-10 block h-11 w-11 text-[#207958] sm:h-14 sm:w-14"
                strokeWidth={2.25}
              />
            </motion.div>

            <motion.h1
              initial={fadeUpItem.initial}
              animate={fadeUpItem.animate}
              transition={{ delay: 0.16, duration: 0.45, ease: "easeOut" }}
              className="text-center text-[clamp(18px,4.2vw,28px)] font-bold text-white"
            >
              Thank you for your order!
            </motion.h1>

            <motion.p
              initial={fadeUpItem.initial}
              animate={fadeUpItem.animate}
              transition={{ delay: 0.24, duration: 0.45, ease: "easeOut" }}
              className="mb-6 text-center text-sm text-white/80 sm:text-base"
            >
              Your order has been placed successfully.
            </motion.p>
          </>
        ) : (
          <div className="mb-6 h-[72px] sm:h-[84px]" />
        )}

      <motion.div
        initial={fadeUpItem.initial}
        animate={fadeUpItem.animate}
        transition={{ delay: 0.32, duration: 0.5, ease: "easeOut" }}
        className="mt-4 w-full max-w-[560px] rounded-[18px] border border-white/45 bg-white/88 px-4 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.12)] backdrop-blur-[6px] sm:px-6 sm:py-6"
      >
        {isLoading ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#d8e9d4] border-t-[#207958]" />
            <p className="text-base font-medium text-[#1f3d1e]">
              Finalizing your order...
            </p>
            <p className="mt-2 text-sm text-[#5f715d]">
              Please wait while we confirm your payment.
            </p>
          </div>
        ) : (
          <>
            <motion.div
              initial={fadeUpItem.initial}
              animate={fadeUpItem.animate}
              transition={{ delay: 0.38, duration: 0.4, ease: "easeOut" }}
              className="mb-4 flex items-center justify-center gap-2 text-[#1a1a1a]"
            >
              <ReceiptText className="h-5 w-5" strokeWidth={1.8} />

              <p className="text-center text-lg font-medium">Order Details</p>
            </motion.div>

            <motion.hr
              initial={{ opacity: 0, scaleX: 0.92 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.42, duration: 0.35, ease: "easeOut" }}
              className="mb-4 h-[1.5px] origin-center border-0 bg-[#d0d0d0] [mask-image:repeating-linear-gradient(to_right,black,black_12px,transparent_12px,transparent_18px)]"
            />

            {rows.map(({ label, value }, index) => (
              <motion.div
                className="flex flex-col items-start gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                key={label}
                initial={fadeUpItem.initial}
                animate={fadeUpItem.animate}
                transition={{
                  delay: 0.48 + index * 0.06,
                  duration: 0.35,
                  ease: "easeOut",
                }}
              >
                <span className="text-sm font-medium text-[#222] sm:text-base">
                  {label}
                </span>

                <span className="text-left text-sm text-[#333] sm:text-right sm:text-base">
                  {value}
                </span>
              </motion.div>
            ))}

            <motion.div
              initial={fadeUpItem.initial}
              animate={fadeUpItem.animate}
              transition={{ delay: 0.76, duration: 0.35, ease: "easeOut" }}
              className="flex flex-row items-start gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <span className="text-sm font-medium text-[#222] sm:text-base">
                Status :
              </span>

              <span className="rounded-xs bg-[#7de07a] px-1.5 py-0.5 text-sm font-semibold tracking-[0.2px] text-[#1a5c1a] sm:text-base">
                Order Placed
              </span>
            </motion.div>

            {primaryActionHref || secondaryActionHref ? (
              <motion.div
                initial={fadeUpItem.initial}
                animate={fadeUpItem.animate}
                transition={{ delay: 0.84, duration: 0.45, ease: "easeOut" }}
                className="mt-5 flex flex-col items-center gap-3 text-center text-lg leading-[1.3] text-white/75"
              >
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  {primaryActionHref && primaryActionLabel ? (
                    primaryActionOnClick ? (
                      <button
                        type="button"
                        onClick={primaryActionOnClick}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 px-10 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        {primaryActionLabel}
                      </button>
                    ) : (
                      <Link
                        href={primaryActionHref}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 px-10 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        {primaryActionLabel}
                      </Link>
                    )
                  ) : null}
                </div>

                <span className="block text-xs text-gray-500">
                  Check your email or order page for more information,
                  <br />
                  and stay tuned for order updates.
                </span>

                {mobileRedirectCountdown !== null ? (
                  <span className="block text-sm text-white/75">
                    Redirecting to your order in {mobileRedirectCountdown}s
                  </span>
                ) : null}
              </motion.div>
            ) : null}
          </>
        )}
      </motion.div>
      </div>
    </div>
  );
}
