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
  const originalPrice =
    product.price + Math.max(35, Math.round(product.price * 0.35));
  const productHref = getProductHref(product);

  return (
    <article className="group isolate overflow-hidden rounded-[0.5rem] bg-[#ffffff] p-2.5 transition-all duration-300 hover:border-[#b8cdb0] hover:shadow-[0_14px_34px_rgba(23,20,16,0.08)] sm:p-3">
      <div className="relative">
        <Link
          href={productHref}
          className="group/image relative block aspect-[1.18] overflow-hidden rounded-[0.5rem] bg-stone-50"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover/image:scale-105"
          />
          <span className="pointer-events-none absolute right-1 top-1 bg-white/92 px-[0.1rem] py-[0.1rem] text-[5px] font-black uppercase tracking-[0.16em] text-[#214f14] opacity-0 backdrop-blur transition-opacity duration-200 group-hover/image:opacity-100 group-focus-within/image:opacity-100 group-active/image:opacity-100">
            Real Image
          </span>
          <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-md bg-white/50 px-1 py-0.5 text-[#111111] shadow-[0_6px_18px_rgba(0,0,0,0.12)] backdrop-blur-md md:bottom-2 md:left-2 md:gap-1.5 md:rounded-lg md:px-2 md:py-1">
            <Star
              size={10}
              fill="currentColor"
              className="h-2.5 w-2.5 text-[#ffba08] md:h-4 md:w-4"
            />
            <span className="text-[0.4rem] font-black md:text-[0.75rem]">
              4.{(product.price % 10) + 1}
            </span>
          </div>
        </Link>
      </div>

      <div className="relative z-10 pt-3">
        <Link href={productHref} className="block min-w-0">
          <p className="line-clamp-1 pr-9 text-[11px] font-medium leading-4 text-[#8d8d8d] sm:pr-11 sm:text-xs">
            {product.category}
          </p>
          <h3 className="mt-1 line-clamp-1 pr-9 text-base font-bold leading-tight tracking-normal text-[#050505] sm:pr-11 sm:text-lg">
            {product.name}
          </h3>

          {product.stock <= 0 ? (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#b23b2b]">
              Out of stock
            </p>
          ) : (
            <p className="mt-0.5 line-clamp-1 pr-9 text-xs font-medium leading-4 text-[#707070] sm:pr-11 sm:text-sm">
              {product.packLabel}
            </p>
          )}
        </Link>

        <WishlistButton
          productId={product.id}
          size={26}
          className="absolute right-0 top-[1.85rem] z-20 shrink-0 p-1 text-[#57ad38] transition-colors sm:right-1 sm:top-[2.35rem]"
        />

        <div className="mt-3.5 sm:mt-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-bold leading-none tracking-normal text-[#050505] sm:text-2xl">
              {formatCurrency(product.price)}
            </span>
            <span className="text-sm font-medium leading-none text-[#9b9b9b] line-through sm:text-base">
              {formatCurrency(originalPrice)}
            </span>
          </div>
          <ProductCardCartControl
            productId={product.id}
            stock={product.stock}
          />
        </div>
      </div>
    </article>
  );
}
