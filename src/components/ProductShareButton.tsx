"use client";

import { Check, Copy, Mail, MessageCircle, QrCode, Share2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppEnvironment } from "@/components/app-environment/AppEnvironmentProvider";
import { shareViaNativeApp } from "@/lib/nativeShare";

type ProductShareButtonProps = {
  title: string;
  text?: string;
  className?: string;
  size?: number;
};

export default function ProductShareButton({
  title,
  text,
  className = "",
  size = 18,
}: ProductShareButtonProps) {
  const { isApp } = useAppEnvironment();
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text || `Check out ${title}`);
  const encodedUrl = encodeURIComponent(shareUrl);
  const whatsappHref = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const emailHref = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
  const qrCodeSrc = useMemo(() => {
    if (!shareUrl) {
      return "";
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodedUrl}`;
  }, [encodedUrl, shareUrl]);

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function openSharePopup() {
    setShareUrl(window.location.href);

    if (
      isApp &&
      shareViaNativeApp({
        title,
        text: `${text || `Check out ${title}`}\n${window.location.href}`,
      })
    ) {
      return;
    }

    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openSharePopup}
        className={`${className} inline-flex touch-manipulation items-center justify-center rounded-full transition`}
        aria-label="Share product"
      >
        <Share2 size={size} />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 px-2 pb-2 pt-10 backdrop-blur-sm sm:items-center sm:px-4 sm:pb-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close share options"
          />

          <section className="relative w-full max-w-[390px] rounded-t-[1.4rem] bg-white p-4 shadow-[0_-18px_60px_rgba(0,0,0,0.18)] sm:rounded-3xl sm:p-5 sm:shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
                  Share product
                </p>
                <h2 className="mt-1 line-clamp-2 text-[1rem] font-bold leading-snug text-[#171410] sm:text-lg">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[#171410] sm:h-9 sm:w-9"
                aria-label="Close share popup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 max-w-full overflow-hidden rounded-2xl border border-[#e6e6e6] bg-[#fafafa] p-3">
              <p className="line-clamp-2 break-all text-[11px] leading-4 text-[#5f5f5f]">
                {shareUrl}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={copyLink}
                className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#e7e7e7] bg-white px-1 py-1.5 text-[10px] font-semibold text-[#171410] sm:min-h-[92px] sm:px-2 sm:py-3 sm:text-xs"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14] sm:h-10 sm:w-10">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </span>
                {copied ? "Copied" : "Copy link"}
              </button>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#e7e7e7] bg-white px-1 py-1.5 text-[10px] font-semibold text-[#171410] sm:min-h-[92px] sm:px-2 sm:py-3 sm:text-xs"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f8ed] text-[#168a3f] sm:h-10 sm:w-10">
                  <MessageCircle size={18} />
                </span>
                WhatsApp
              </a>

              <a
                href={emailHref}
                className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#e7e7e7] bg-white px-1 py-1.5 text-[10px] font-semibold text-[#171410] sm:min-h-[92px] sm:px-2 sm:py-3 sm:text-xs"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4fc] text-[#2c6db3] sm:h-10 sm:w-10">
                  <Mail size={18} />
                </span>
                Email
              </a>
            </div>

            <div className="mt-4 rounded-2xl border border-[#e7e7e7] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#171410]">
                <QrCode size={17} />
                Scan QR code
              </div>
              <div className="mt-3 flex justify-center">
                {qrCodeSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeSrc}
                    alt={`QR code for ${title}`}
                    width={180}
                    height={180}
                    className="rounded-xl border border-[#eeeeee]"
                  />
                ) : (
                  <div className="h-[180px] w-[180px] rounded-xl bg-[#f4f4f4]" />
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
