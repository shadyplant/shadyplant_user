import Link from "next/link";
import { ArrowRight, ShoppingCart, Truck } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { cartItems, getProductById } from "@/content/store";

const deliveryFee = 249;

export default function CartPage() {
  const items = cartItems.flatMap((item) => {
      const product = getProductById(item.productId);

      if (!product) {
        return [];
      }

      return [
        {
          ...item,
          product,
          subtotal: product.price * item.quantity,
        },
      ];
    });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal + deliveryFee;

  return (
    <SiteShell>
      <section className="px-4 py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="theme-chip px-5 py-2 text-xs font-bold uppercase tracking-[0.24em]">
              <ShoppingCart size={14} />
              Cart
            </div>
            <h1 className="theme-section-title mt-4 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              Review selected products before checkout
            </h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.product.id}
                  className="theme-panel-strong rounded-[2rem] p-5"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6b8b58]">
                        {item.product.category}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#163915]">
                        {item.product.name}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-[#58724f]">
                        {item.product.description}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-[#214f14] md:min-w-[180px]">
                      <div className="flex items-center justify-between gap-6">
                        <span>Qty</span>
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span>Rate</span>
                        <span className="font-semibold">₹{item.product.price}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6 border-t border-[#d8e8c0] pt-3">
                        <span>Subtotal</span>
                        <span className="text-lg font-black">₹{item.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="theme-panel-strong h-fit rounded-[2rem] p-6">
              <h2 className="text-2xl font-bold tracking-[-0.04em] text-[#163915]">
                Order summary
              </h2>

              <div className="mt-6 space-y-4 text-sm text-[#214f14]">
                <div className="flex items-center justify-between">
                  <span>Items total</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <Truck size={15} />
                    Delivery
                  </span>
                  <span className="font-semibold">₹{deliveryFee}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#d8e8c0] pt-4 text-lg font-black">
                  <span>Total payable</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button className="theme-button mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold">
                Proceed to checkout
                <ArrowRight size={16} />
              </button>
              <Link
                href="/order"
                className="theme-panel mt-3 flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-semibold text-[#214f14]"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
