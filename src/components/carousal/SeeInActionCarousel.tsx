"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type SeeInActionCarouselProps = {
  images: string[];
  productName: string;
};

export default function SeeInActionCarousel({
  images,
  productName,
}: SeeInActionCarouselProps) {
  const galleryImages = images.filter(Boolean);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = galleryImages[activeIndex] || "";

  function openImage(index: number) {
    setActiveIndex(index);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function goToPrevious() {
    setActiveIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  }

  function goToNext() {
    setActiveIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  }

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === 0 ? galleryImages.length - 1 : current - 1,
        );
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === galleryImages.length - 1 ? 0 : current + 1,
        );
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModalOpen, galleryImages.length]);

  if (!galleryImages.length) {
    return null;
  }

  return (
    <section className="w-full py-4 md:py-8 md:px-6">
      {/* Header section with minimal edge padding */}
      <div className="w-full mb-3 md:mb-6">
        <h2 className="text-medium font-semibold leading-4 text-[#111111] md:text-xl md:leading-6">
          Real life view
        </h2>
        <p className="mt-0.5 text-[11px] leading-4 text-[#555555] md:text-sm">
          Real customer-style clips and previews for {productName}
        </p>
      </div>

      {/* Full Width Horizontal Scroll Container */}
      <div className="w-full">
        <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2 md:px-4 md:gap-4 scrollbar-hide">
          {galleryImages.map((image, index) => {
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => openImage(index)}
                aria-label={`Open ${productName} real life view ${index + 1}`}
                className="relative h-[360px] w-[230px] shrink-0 snap-start select-none overflow-hidden rounded-2xl shadow-sm md:h-[500px] md:w-[300px]"
              >
                <Image
                  src={image}
                  alt={`${productName} real life view ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 230px, 300px"
                  className="pointer-events-none object-cover transition duration-300 hover:scale-[1.02]"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      </div>

      {isModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[140] flex items-stretch justify-center bg-[#0f170c]/40 backdrop-blur-[6px] md:items-center md:px-6 md:py-6"
              role="dialog"
              aria-modal="true"
              aria-label={`${productName} real life view`}
            >
              <button
                type="button"
                className="absolute inset-0 cursor-default"
                aria-label="Close real life view popup"
                onClick={closeModal}
              />

              <section className="relative z-[1] flex h-full w-full max-w-none flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)] md:h-auto md:max-w-[min(92vw,1100px)] md:rounded-[1.2rem] md:border md:border-white/60">
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#666666] shadow-sm transition hover:bg-neutral-50 md:right-5 md:top-5"
                  aria-label="Close image preview"
                >
                  <X size={18} />
                </button>

                <div className="hidden items-center justify-between gap-4 border-b border-[#e8e8e8] px-4 py-3 md:flex md:px-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
                      Real life view
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#171410] md:text-lg">
                      {productName}
                    </h3>
                  </div>
                </div>

                <div className="relative flex flex-1 items-center justify-center bg-[#f7f7f4] px-0 py-0 md:min-h-[min(72vh,720px)] md:px-6 md:py-6">
                  <div className="relative h-full w-full overflow-hidden rounded-none bg-[#ededeb] md:h-[min(70vh,680px)] md:rounded-[1rem]">
                    <Image
                      src={activeImage}
                      alt={`${productName} real life view ${activeIndex + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 1100px"
                      className="object-contain"
                      unoptimized
                    />
                  </div>

                  {galleryImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={goToPrevious}
                        className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#171410] shadow-md transition hover:bg-neutral-50 md:left-4 md:h-11 md:w-11"
                        aria-label="Show previous real life image"
                      >
                        <ChevronLeft size={20} className="md:hidden" />
                        <ChevronLeft size={22} className="hidden md:block" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNext}
                        className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#171410] shadow-md transition hover:bg-neutral-50 md:right-4 md:h-11 md:w-11"
                        aria-label="Show next real life image"
                      >
                        <ChevronRight size={20} className="md:hidden" />
                        <ChevronRight size={22} className="hidden md:block" />
                      </button>

                      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
                        {galleryImages.map((image, index) => (
                          <button
                            key={`${image}-dot-${index}`}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Show ${productName} real life view ${index + 1}`}
                            className={`h-2.5 rounded-full transition ${
                              index === activeIndex ? "w-5 bg-[#171410]" : "w-2.5 bg-[#171410]/35"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
