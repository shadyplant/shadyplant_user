import CategorySection from "@/components/CategorySection";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";
import HomeSlider from "@/pages/Home/components/HomeSlider";

type ProductSection = {
  title: string;
  products: Product[];
};

function ProductGridSection({ title, products }: ProductSection) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="px-2 md:px-6">
      <div className="mx-auto max-w-7xl p-0 md:p-2">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <span className="theme-section-title text-lg font-bold tracking-tight text-[#163915] md:mt-2 md:text-2xl">
              {title}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage({ products }: { products: Product[] }) {
  const productSections: ProductSection[] = [
    {
      title: "Latest product showcase",
      products,
    },
    {
      title: "Indoor plant favorites",
      products: products.filter(
        (product) => product.category === "Indoor Plants",
      ),
    },
    {
      title: "Lawn and outdoor essentials",
      products: products.filter((product) =>
        ["Outdoor Plants", "Lawn Grass"].includes(product.category),
      ),
    },
    {
      title: "Fern collection spotlight",
      products: products.filter((product) => product.category === "Ferns"),
    },
  ];

  return (
    <div className="space-y-4 pb-24 pt-0 md:pb-12 md:pt-0">
      <CategorySection />
      <HomeSlider />

      {productSections.map((section) => (
        <ProductGridSection
          key={section.title}
          title={section.title}
          products={section.products}
        />
      ))}
    </div>
  );
}
