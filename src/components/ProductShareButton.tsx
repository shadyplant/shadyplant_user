"use client";

import { Check, Copy, Mail, MessageCircle, QrCode, Share2, X } from "lucide-react";
import { useMemo, useState } from "react";

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
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close share options"
          />

          <section className="relative w-full max-w-[390px] rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
                  Share product
                </p>
                <h2 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-[#171410]">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[#171410]"
                aria-label="Close share popup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#e6e6e6] bg-[#fafafa] p-3">
              <p className="truncate text-xs text-[#5f5f5f]">{shareUrl}</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={copyLink}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#e7e7e7] bg-white px-2 py-3 text-xs font-semibold text-[#171410]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14]">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </span>
                {copied ? "Copied" : "Copy link"}
              </button>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#e7e7e7] bg-white px-2 py-3 text-xs font-semibold text-[#171410]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f8ed] text-[#168a3f]">
                  <MessageCircle size={18} />
                </span>
                WhatsApp
              </a>

              <a
                href={emailHref}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#e7e7e7] bg-white px-2 py-3 text-xs font-semibold text-[#171410]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4fc] text-[#2c6db3]">
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
