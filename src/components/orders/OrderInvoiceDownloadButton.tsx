"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import OrderInvoiceDocument from "@/components/orders/OrderInvoiceDocument";
import { type Order } from "@/components/orders/orderUtils";

async function waitForInvoiceAssets(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );

  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }
}

function getInvoiceFileName(order: Order) {
  const safeOrderNumber = String(order.orderNumber || order.id || "invoice")
    .trim()
    .replace(/[^A-Za-z0-9-]/g, "-");

  return `invoice-${safeOrderNumber}.pdf`;
}

export default function OrderInvoiceDownloadButton({ order }: { order: Order }) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!invoiceRef.current || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      await waitForInvoiceAssets(invoiceRef.current);

      const canvas = await html2canvas(invoiceRef.current, {
        scale: Math.max(4, window.devicePixelRatio || 1),
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: invoiceRef.current.scrollWidth,
        windowHeight: invoiceRef.current.scrollHeight,
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png", 1);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "SLOW");
      pdf.save(getInvoiceFileName(order));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#dbe8cd] bg-white px-4 py-2 text-sm font-semibold text-[#214f14] transition hover:bg-[#f4fbf2] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {isGenerating ? "Preparing invoice..." : "Download invoice"}
      </button>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-10000px] top-0 z-[-1] opacity-100"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div
          ref={invoiceRef}
          className="w-[210mm] bg-[#ffffff]"
          style={{ backgroundColor: "#ffffff", color: "#111111" }}
        >
          <OrderInvoiceDocument order={order} standalone={false} />
        </div>
      </div>
    </>
  );
}
