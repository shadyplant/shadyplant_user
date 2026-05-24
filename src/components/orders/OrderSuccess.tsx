"use client";

import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface OrderSuccessProps {
  orderNumber?: string;
  orderDate?: string;
  deliveryDate?: string;
  total?: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
}

export default function OrderSuccess({
  orderNumber = "INV-00234",
  orderDate = "10/05/2026",
  deliveryDate = "18/05/2026",
  total = "1,52560.00",
  primaryActionHref,
  primaryActionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: OrderSuccessProps) {
  const fadeUpItem = {
    initial: { opacity: 0, y: 14, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
  };

  useEffect(() => {
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

    const fire = (particleRatio: number, options: Parameters<typeof confetti>[0]) => {
      confetti({
        ...sharedOptions,
        ...options,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    fire(0.25, { spread: 50, startVelocity: 55, origin: { x: 0.5, y: 0.25 } });
    const burstOne = window.setTimeout(() => {
      fire(0.2, { spread: 75, origin: { x: 0.2, y: 0.35 } });
      fire(0.2, { spread: 75, origin: { x: 0.8, y: 0.35 } });
    }, 180);
    const burstTwo = window.setTimeout(() => {
      fire(0.18, { spread: 95, decay: 0.92, scalar: 0.95, origin: { x: 0.35, y: 0.25 } });
      fire(0.18, { spread: 95, decay: 0.92, scalar: 0.95, origin: { x: 0.65, y: 0.25 } });
    }, 420);

    return () => {
      window.clearTimeout(burstOne);
      window.clearTimeout(burstTwo);
    };
  }, []);

  const rows = [
    { label: "Order Number :", value: orderNumber },
    { label: "Order Date :", value: orderDate },
    { label: "Expected Delivery Date :", value: deliveryDate },
    { label: "Total :", value: total },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#4a9e5c] bg-[radial-gradient(ellipse_at_20%_30%,rgba(255,255,255,0.06)_0%,transparent_60%),radial-gradient(ellipse_at_80%_70%,rgba(0,0,0,0.08)_0%,transparent_60%)] px-5 py-8 font-sans sm:px-8">
      <div className="relative z-[5] flex w-full max-w-[620px] flex-col items-center">
        <motion.div
          initial={{ scale: 0.45, opacity: 0 }}
          animate={{ scale: [0.45, 1.14, 1], opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
          className="relative mb-6"
        >
          <motion.span
            aria-hidden="true"
            initial={{ scale: 0.7, opacity: 0.35 }}
            animate={{ scale: 1.18, opacity: 0 }}
            transition={{ delay: 0.32, duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-[#b8efae]"
          />
          <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-white/50 bg-[#7de07a] shadow-[0_0_0_8px_rgba(125,224,122,0.2)]">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[34px] w-[34px] fill-none stroke-white [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:3]"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </motion.div>

        <motion.h1
          initial={fadeUpItem.initial}
          animate={fadeUpItem.animate}
          transition={{ delay: 0.16, duration: 0.45, ease: "easeOut" }}
          className="text-center text-[clamp(26px,5vw,38px)] font-bold text-white"
        >
          Thank you for your order!
        </motion.h1>
        <motion.p
          initial={fadeUpItem.initial}
          animate={fadeUpItem.animate}
          transition={{ delay: 0.24, duration: 0.45, ease: "easeOut" }}
          className="mb-8 text-center text-2xl text-white/80"
        >
          Your order has been placed successfully.
        </motion.p>

        <motion.div
          initial={fadeUpItem.initial}
          animate={fadeUpItem.animate}
          transition={{ delay: 0.32, duration: 0.5, ease: "easeOut" }}
          className="w-full rounded-[18px] bg-white px-5 py-[22px] sm:px-8 sm:py-7"
        >
          <motion.div
            initial={fadeUpItem.initial}
            animate={fadeUpItem.animate}
            transition={{ delay: 0.38, duration: 0.4, ease: "easeOut" }}
            className="mb-5 flex items-center justify-center gap-2 text-[#1a1a1a]"
          >
            <ReceiptText className="h-6 w-6" strokeWidth={1.8} />
            <p className="text-center text-2xl font-medium">Order Details</p>
          </motion.div>
          <motion.hr
            initial={{ opacity: 0, scaleX: 0.92 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.42, duration: 0.35, ease: "easeOut" }}
            className="mb-5 h-[1.5px] origin-center border-0 bg-[#d0d0d0] [mask-image:repeating-linear-gradient(to_right,black,black_12px,transparent_12px,transparent_18px)]"
          />

          {rows.map(({ label, value }, index) => (
            <motion.div
              className="flex flex-col items-start gap-0.5 py-[9px] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              key={label}
              initial={fadeUpItem.initial}
              animate={fadeUpItem.animate}
              transition={{ delay: 0.48 + index * 0.06, duration: 0.35, ease: "easeOut" }}
            >
              <span className="text-xl font-medium text-[#222]">{label}</span>
              <span className="text-left text-xl font-normal text-[#333] sm:text-right">
                {value}
              </span>
            </motion.div>
          ))}

          <motion.div
            initial={fadeUpItem.initial}
            animate={fadeUpItem.animate}
            transition={{ delay: 0.76, duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-start gap-0.5 py-[9px] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span className="text-xl font-medium text-[#222]">Status :</span>
            <span className="rounded-md bg-[#7de07a] px-[14px] py-1 text-xl font-semibold tracking-[0.2px] text-[#1a5c1a]">
              Order Placed
            </span>
          </motion.div>
        </motion.div>

        <motion.p
          initial={fadeUpItem.initial}
          animate={fadeUpItem.animate}
          transition={{ delay: 0.84, duration: 0.45, ease: "easeOut" }}
          className="mt-7 text-center text-lg leading-[1.3] text-white/75"
        >
          {primaryActionHref || secondaryActionHref ? (
            <span className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {primaryActionHref && primaryActionLabel ? (
                <Link
                  href={primaryActionHref}
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#2b6134] transition hover:bg-white/90"
                >
                  {primaryActionLabel}
                </Link>
              ) : null}
              {secondaryActionHref && secondaryActionLabel ? (
                <Link
                  href={secondaryActionHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {secondaryActionLabel}
                </Link>
              ) : null}
            </span>
          ) : null}
          <span className="block">
          Check your email or order page for more information,
          <br />
          and stay tuned for order updates.
          </span>
        </motion.p>
      </div>
    </div>
  );
}
