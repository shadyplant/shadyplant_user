import Image from "next/image";
import Link from "next/link";
import { Plus, ShoppingCart, Star } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import type { Product } from "@/content/store";

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
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-xl border border-stone-100 bg-white p-2 transition-all duration-300 hover:shadow-md md:p-4"
    >
      <article>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-50">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          {/* Rating Badge */}
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[#171410] backdrop-blur-sm shadow-sm">
            <Star size={12} fill="currentColor" className="text-yellow-500" />
            <span className="text-[10px] font-bold md:text-xs">
              4.{(product.price % 10) + 1}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-stone-500 md:text-xs">
                {product.category}
              </p>
              <h3 className="mt-1 line-clamp-1 text-base font-bold text-[#171410] md:text-lg">
                {product.name}
              </h3>
              <p className="text-xs text-stone-500">
                {product.packLabel}
              </p>
            </div>

            <WishlistButton
              productId={product.id}
              size={25}
              className="mt-1 shrink-0 text-[#008000] hover:text-red-500 transition-colors"
            />
          </div>

          {/* Pricing Section */}
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#171410] md:text-2xl">
                  ₹{product.price}
                </span>
                <span className="text-sm text-stone-400 line-through">
                  ₹{originalPrice}
                </span>
              </div>
              <p className="text-[10px] font-medium text-green-600 md:text-xs">
                {discountPercent}% OFF • SAVE MORE+
              </p>
            </div>

            {/* Add Button */}
            <button 
            // bg-stone-900
              aria-label="Add to cart"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-stone-800 md:h-12 md:w-12"
            >
              {/* <Plus size={20} strokeWidth={2.5} /> */}
              <AddToCartIcon />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

function AddToCartIcon() {
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Cart Icon */}
      <ShoppingCart className="w-7 h-7 text-green-600" />

      {/* Plus Icon */}
      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow">
        <Plus className="w-4 h-4 text-green-600" />
      </div>
    </div>
  );
}