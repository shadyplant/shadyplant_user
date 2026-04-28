import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const originalPrice = product.price + Math.max(35, Math.round(product.price * 0.35));
  const discountPercent = Math.min(
    60,
    Math.max(20, Math.round(((originalPrice - product.price) / originalPrice) * 100)),
  );

  return (
    <article className="group rounded-xl border border-stone-100 bg-white p-2 transition-all duration-300 hover:shadow-md md:p-4">
      <div className="relative">
        <Link
          href={`/products/${product.id}`}
          className="relative block aspect-square overflow-hidden rounded-lg bg-stone-50"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[#171410] shadow-sm backdrop-blur-sm">
            <Star size={12} fill="currentColor" className="text-yellow-500" />
            <span className="text-[10px] font-bold md:text-xs">
              4.{(product.price % 10) + 1}
            </span>
          </div>
        </Link>

        <WishlistButton
          productId={product.id}
          size={25}
          className="absolute right-3 top-3 z-20 shrink-0 touch-manipulation rounded-full bg-white/90 p-1.5 text-[#008000] shadow-sm transition-colors hover:text-red-500"
        />
      </div>

      <div className="pt-4">
        <Link href={`/products/${product.id}`} className="block min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-stone-500 md:text-xs">
            {product.category}
          </p>
          <h3 className="mt-1 line-clamp-1 text-base font-bold text-[#171410] md:text-lg">
            {product.name}
          </h3>
          <p className="text-xs text-stone-500">{product.packLabel}</p>
        </Link>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-bold text-[#171410] md:text-2xl">
                {formatCurrency(product.price)}
              </span>
              <span className="text-sm text-stone-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            </div>
            <p className="text-[10px] font-medium text-green-600 md:text-xs">
              {discountPercent}% OFF • SAVE MORE+
            </p>
          </div>

          <AddToCartButton
            productId={product.id}
            compact
            className="relative z-20 flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-[#214f14] text-white transition-colors hover:bg-[#163915] md:h-12 md:w-12"
          />
        </div>
      </div>
    </article>
  );
}
