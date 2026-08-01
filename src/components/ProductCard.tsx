import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import ProductCardCartControl from "@/components/ProductCardCartControl";
import WishlistButton from "@/components/WishlistButton";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Product } from "@/lib/products";
import { getProductHref } from "@/lib/productUrls";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const productHref = getProductHref(product);
  const productHighlights = [
    product.variety,
    product.containerSize,
    product.height,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return (
    <article className="group isolate overflow-hidden rounded-[0.5rem] bg-[#ffffff] p-1 transition-all duration-300 hover:border-[#b8cdb0] hover:shadow-[0_14px_34px_rgba(23,20,16,0.08)] sm:p-3">
      <div className="relative">
        <Link
          href={productHref}
          className="group/image relative block aspect-[0.9] overflow-hidden rounded-[0.5rem] bg-stone-50"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover/image:scale-105"
          />
          <span className="pointer-events-none absolute left-2 top-2 bg-white/92 px-[0.1rem] py-[0.1rem] text-[10px] font-semibold px-[0.3rem] rounded-[0.25rem] text-[#214f14] opacity-0 backdrop-blur transition-opacity duration-200 group-hover/image:opacity-100 group-focus-within/image:opacity-100 group-active/image:opacity-100">
            Original
          </span>
          <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-md bg-white/70 px-1 py-0.5 text-[#111111] shadow-[0_6px_18px_rgba(0,0,0,0.12)] backdrop-blur-md md:bottom-2 md:left-2 md:gap-1.5 md:rounded-lg md:px-2 md:py-1">
            <Star
              size={10}
              fill="currentColor"
              className="h-2.5 w-2.5 text-[#ffba08] md:h-4 md:w-4"
            />
            <span className="text-[0.6rem] md:text-[0.75rem]">
              4.{(product.price % 10) + 1}
            </span>
          </div>
        </Link>

        <WishlistButton
          productId={product.id}
          size={21}
          className="absolute right-2 top-2 z-20 shrink-0 rounded-full bg-white/70 p-1 shadow-[0_6px_18px_rgba(0,0,0,0.12)] backdrop-blur transition-colors hover:bg-white/90 sm:right-2.5 sm:top-2.5"
        />
      </div>

      <div className="relative z-10 pt-3">
        <Link href={productHref} className="block min-w-0">
          <h3 className="mt-1 min-h-0 md:min-h-[2.2rem] text-xs font-semibold text-gray-800 line-clamp-1 md:line-clamp-2 sm:min-h-0 sm:line-clamp-none  sm:text-lg">
            {product.name}
          </h3>

          {product.stock <= 0 ? (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#b23b2b]">
              Out of stock
            </p>
          ) : (
            <>
              {productHighlights.length ? (
                <p className="mt-0 line-clamp-1 pr-2 text-[11px] leading-4 text-[#7a7a7a] sm:text-xs">
                  {productHighlights.join(" | ")}
                </p>
              ) : null}
            </>
          )}
        </Link> 

        <div className="mt-2 md:mt-4 sm:mt-5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-medium text-[#07ab4e] sm:text-2xl">
              {formatCurrency(product.price)}
            </span>
            {product.mrp > product.price ? (
              <span className="text-[12px] font-semidbold text-[#9b9b9b] line-through sm:text-base">
                {formatCurrency(product.mrp)}
              </span>
            ) : null}
          </div>
          <p className="mt-0 text-[11px] text-[#707070]  sm:text-xs">
            Min. Qty - {product.minOrderQuantity} Pcs.
          </p>
          <ProductCardCartControl
            productId={product.id}
            stock={product.stock}
            minOrderQuantity={product.minOrderQuantity}
          />
        </div>
      </div>
    </article>
  );
}
