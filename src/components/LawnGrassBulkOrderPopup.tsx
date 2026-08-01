"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { X } from "lucide-react";
import LawnGrassBulkOrderEstimator from "@/components/LawnGrassBulkOrderEstimator";
import { fetchLawnGrassPageProduct, fetchProducts, type Product } from "@/lib/products";
import { slugifyProductName } from "@/lib/productUrls";

type LawnGrassBulkOrderPopupProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

async function loadLawnGrassContent() {
  let products: Product[] = [];

  try {
    products = await fetchProducts({
      query: "lawn grass",
      limit: 24,
    });
  } catch {
    products = [];
  }

  let linkedProduct: Product | null = null;

  try {
    linkedProduct = await fetchLawnGrassPageProduct();
  } catch {
    linkedProduct = null;
  }

  const product =
    linkedProduct ||
    products.find((item) => slugifyProductName(item.name) === "lawn-grass") ||
    products.find((item) => slugifyProductName(item.name).includes("lawn-grass")) ||
    products.find((item) => slugifyProductName(item.name).includes("lawn")) ||
    products.find((item) => slugifyProductName(item.name).includes("grass")) ||
    products.find((item) => item.tags.some((tag) => slugifyProductName(tag).includes("lawn-grass"))) ||
    products.find((item) => item.tags.some((tag) => slugifyProductName(tag).includes("grass"))) ||
    null;

  if (!product) {
    throw new Error("Unable to load lawn grass calculator.");
  }

  return {
    product,
  };
}

export default function LawnGrassBulkOrderPopup({
  open,
  defaultOpen = false,
  onOpenChange,
}: LawnGrassBulkOrderPopupProps) {
  const titleId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [content, setContent] = useState<{
    product: Product;
  } | null>(null);

  const resolvedOpen = useMemo(() => isOpen, [isOpen]);

  function setOpen(nextOpen: boolean) {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  useEffect(() => {
    if (!resolvedOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [resolvedOpen]);

  useEffect(() => {
    if (!resolvedOpen) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError("");

      try {
        const nextContent = await loadLawnGrassContent();
        if (!cancelled) {
          setContent(nextContent);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load calculator.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [resolvedOpen]);

  if (!resolvedOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-white px-3 py-4 backdrop-blur-[2px] md:px-6 md:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close lawn grass calculator"
        onClick={() => setOpen(false)}
      />

      <div className="relative z-[1] max-h-[92vh] w-full max-w-[55%] overflow-hidden rounded-[1rem] border border-[#e8e8e8] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e8e8e8] bg-white px-5 py-4 md:px-7">
          <div>
            <h2 id={titleId} className="mt-1 text-xl font-semibold text-gray-800 md:text-xl">
              Estimate delivery cost
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e4e4] text-[#666666] transition hover:bg-neutral-50"
            aria-label="Close lawn grass calculator"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-74px)] overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[0.9rem] bg-white text-[#6d6d6d]">
              Loading calculator...
            </div>
          ) : loadError ? (
            <div className="rounded-[0.9rem] border border-[#f2d3d3] bg-[#fff7f7] px-5 py-4 text-sm text-[#b42318]">
              {loadError}
            </div>
          ) : content ? (
            <div className="rounded-[0.9rem] bg-white p-4 md:px-6 md:py-6">
              <LawnGrassBulkOrderEstimator product={content.product} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
