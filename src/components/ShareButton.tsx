"use client";

import { Check, Copy, Mail, MessageCircle, QrCode, Share2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useAppEnvironment } from "@/components/app-environment/AppEnvironmentProvider";
import { shareViaNativeApp } from "@/lib/nativeShare";

type ShareButtonProps = {
  url?: string;
  productName?: string;
  className?: string;
};

export default function ShareButton({
  url,
  productName,
  className = "",
}: ShareButtonProps) {
  const { isApp } = useAppEnvironment();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [open, setOpen] = useState(false);

  const href = typeof window !== "undefined" ? url ?? window.location.href : url ?? "";
  const shareText = useMemo(
    () => (productName ? `${productName} - ${href}` : href),
    [href, productName],
  );
  const emailSubject = productName ?? "Check this out";
  const emailBody = productName ? `Check out ${productName}: ${href}` : href;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const qrCodeSrc = useMemo(() => {
    if (!href) {
      return "";
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(href)}`;
  }, [href]);

  const handleShare = async () => {
    if (
      isApp &&
      shareViaNativeApp({
        title: productName || document.title,
        url: href,
        text: shareText,
      })
    ) {
      return;
    }

    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2000);
  };

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const modal =
    typeof document !== "undefined" && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[130] flex items-end justify-center bg-[#0f170c]/18 px-2 py-2 backdrop-blur-[6px] md:items-center md:px-6 md:py-6"
            role="dialog"
            aria-modal="true"
            aria-label="Share product"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() => setOpen(false)}
              aria-label="Close share options"
            />

            <section className="relative z-[1] w-full max-w-[44rem] overflow-hidden rounded-t-[1.4rem] border border-[#e8e8e8] bg-white shadow-[0_-18px_60px_rgba(0,0,0,0.18)] md:rounded-[1rem] md:shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
              <div className="flex items-start justify-between gap-3 border-b border-[#e8e8e8] bg-white px-4 py-4 md:gap-4 md:px-7">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
                    Share product
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-[1rem] font-bold leading-snug text-[#171410] md:text-lg">
                    {productName || "Product"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4e4e4] text-[#666666] transition hover:bg-neutral-50 md:h-10 md:w-10"
                  aria-label="Close share popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[calc(92vh-74px)] overflow-y-auto px-3 py-4 md:p-6">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <div className="min-w-0">
                    <div className="max-w-full overflow-hidden rounded-2xl border border-[#e7e7e7] bg-[#fafafa] px-3 py-2.5">
                      <p className="line-clamp-2 break-all text-[11px] leading-4 text-[#5f5f5f]">
                        {href}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#e7e7e7] bg-white px-1 py-1.5 text-[10px] font-semibold text-[#171410] transition hover:-translate-y-0.5 hover:border-[#cfd8c0] sm:min-h-[92px] sm:px-2 sm:py-3 sm:text-xs"
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14] sm:h-10 sm:w-10">
                          {status === "copied" ? <Check size={18} /> : <Copy size={18} />}
                        </span>
                        {status === "copied" ? "Copied" : "Copy"}
                      </button>

                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#e7e7e7] bg-white px-1 py-1.5 text-[10px] font-semibold text-[#171410] transition hover:-translate-y-0.5 hover:border-[#cfe7d3] sm:min-h-[92px] sm:px-2 sm:py-3 sm:text-xs"
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f8ed] text-[#168a3f] sm:h-10 sm:w-10">
                          <MessageCircle size={18} />
                        </span>
                        WhatsApp
                      </a>

                      <a
                        href={emailHref}
                        className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#e7e7e7] bg-white px-1 py-1.5 text-[10px] font-semibold text-[#171410] transition hover:-translate-y-0.5 hover:border-[#dbe4f2] sm:min-h-[92px] sm:px-2 sm:py-3 sm:text-xs"
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4fc] text-[#2c6db3] sm:h-10 sm:w-10">
                          <Mail size={18} />
                        </span>
                        Email
                      </a>
                    </div>

                    <p className="mt-4 text-[11px] leading-5 text-[#6f6f6f]">
                      Share this product through your preferred channel without leaving the page.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e7e7e7] bg-white p-4 md:p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#171410]">
                      <QrCode size={17} />
                      Scan QR code
                    </div>
                    <div className="mt-3 flex justify-center">
                      {qrCodeSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrCodeSrc}
                          alt={`QR code for ${productName || "product"}`}
                          width={180}
                          height={180}
                          className="rounded-xl border border-[#eeeeee]"
                        />
                      ) : (
                        <div className="h-[180px] w-[180px] rounded-xl bg-[#f4f4f4]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleShare}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Share product"
        className={`inline-flex items-center justify-center rounded-lg bg-white/70 p-1 text-gray-600 shadow-md backdrop-blur transition hover:bg-white/90 focus:outline-none ${className}`}
      >
        <Share2 size={20} />
      </button>

      {modal}
    </div>
  );
}
