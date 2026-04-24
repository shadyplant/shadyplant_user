import Image from "next/image";
import Link from "next/link";
import { Leaf, ShieldCheck, Truck, Undo2,ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import SiteShell from "@/components/SiteShell";
import WishlistButton from "@/components/WishlistButton";
import { getProductById, latestProducts } from "@/content/store";

export function generateStaticParams() {
  return latestProducts.map((product) => ({ id: product.id }));
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = latestProducts
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  return (
    <SiteShell>
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#5b7751]">
            <Link href="/" className="hover:text-[#214f14]">
              Home
            </Link>
            <span><ArrowRight size={16} /></span>
            <Link href="/order" className="hover:text-[#214f14]">
              Order
            </Link>
            <span><ArrowRight size={16} /></span>
            <span className="text-[#214f14]">{product.name}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-[2.2rem] border border-[#d6e6bd] bg-white p-4 shadow-[0_24px_56px_rgba(33,79,20,0.08)]">
              <div className="relative h-[320px] overflow-hidden rounded-[1.8rem] md:h-[520px]">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-[#d6e6bd] bg-[#f7fbf1] p-6 shadow-[0_24px_56px_rgba(33,79,20,0.06)] md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#173d12] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                  {product.badge}
                </span>
                <span className="rounded-full border border-[#d6e6bd] bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
                  {product.category}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] text-[#163915] md:text-6xl">
                {product.name}
              </h1>
              <p className="mt-2 text-sm font-semibold text-[#214f14]">{product.packLabel}</p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#58724f] md:text-lg">
                {product.description}
              </p>

              <div className="mt-6 flex items-end gap-2">
                <p className="text-3xl font-extrabold text-[#214f14] md:text-5xl">
                  ₹{product.price}
                </p>
                <span className="pb-1 text-sm font-semibold text-[#6c8a63]">{product.unit}</span>
              </div>

              <div className="mt-8 grid gap-3 rounded-[1.75rem] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5c7752]">Availability</span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#214f14]">
                    <Leaf size={15} />
                    In stock
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5c7752]">Care level</span>
                  <span className="text-sm font-semibold text-[#214f14]">{product.badge}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5c7752]">Category</span>
                  <span className="text-sm font-semibold text-[#214f14]">{product.category}</span>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <button className="rounded-full border border-[#cfe0b5] bg-white px-5 py-3 text-sm font-semibold text-[#214f14]">
                  Add to cart
                </button>
                <WishlistButton
                  productId={product.id}
                  size={20}
                  className="h-[50px] w-[50px] border border-[#cfe0b5] bg-white text-[#214f14]"
                />
                <Link
                  href="/order"
                  className="theme-button rounded-full px-5 py-3 text-center text-sm font-semibold sm:col-span-2"
                >
                  Continue shopping
                </Link>
              </div>

              <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-[#dce8ce] bg-[#edf5e1] p-5">
                <div className="flex items-center gap-3 text-sm font-semibold text-[#214f14]">
                  <Truck size={18} />
                  Same-day dispatch on ready nursery stock
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-[#214f14]">
                  <ShieldCheck size={18} />
                  Plant-safe packaging for healthy delivery
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-[#214f14]">
                  <Undo2 size={18} />
                  Expert help for plant selection and care
                </div>
              </div>
            </div>
          </div>

          {relatedProducts.length ? (
            <div className="mt-10 rounded-[2.2rem] border border-[#d6e6bd] bg-[#eef5e3] p-6 md:p-8">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6b8b58]">
                  More to explore
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#163915] md:text-4xl">
                  Similar picks you may like
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </SiteShell>
  );
}
