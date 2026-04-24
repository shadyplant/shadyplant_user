import { CheckCircle2, ShoppingBag } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import SiteShell from "@/components/SiteShell";
import { latestProducts, orderHighlights } from "@/content/store";

export default function OrderPage() {
  return (
    <SiteShell>
      <section className="px-2 py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="theme-chip px-5 py-2 text-xs font-bold uppercase tracking-[0.24em]">
              <ShoppingBag size={14} />
              Order Page
            </div>
            <h1 className="theme-section-title mt-4 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              Place nursery orders with clearer product grouping
            </h1>
            <p className="theme-muted mt-4 max-w-3xl text-base leading-7">
              This page is structured for product-first shopping, making it easier
              to extend into quantity controls, checkout, and backend inventory sync.
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {orderHighlights.map((item) => (
              <div key={item} className="theme-panel rounded-[1.75rem] p-5">
                <div className="inline-flex rounded-full bg-[#e7f7cf] p-3 text-[#214f14]">
                  <CheckCircle2 size={18} />
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-[#214f14]">{item}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
