import CategorySection from "@/components/CategorySection";
import ProductCard from "@/components/ProductCard";
import { latestProducts } from "@/content/store";
import HomeSlider from "@/pages/Home/components/HomeSlider";

type ProductSection = {
  eyebrow: string;
  title: string;
  products: typeof latestProducts;
};

const productSections: ProductSection[] = [
  {
    eyebrow: "Recommended for your storefront",
    title: "Latest product showcase",
    products: latestProducts,
  },
  {
    eyebrow: "Easy-care picks for homes",
    title: "Indoor plant favorites",
    products: latestProducts.filter(
      (product) => product.category === "Indoor Plants",
    ),
  },
  {
    eyebrow: "Fresh greens for open spaces",
    title: "Lawn and outdoor essentials",
    products: latestProducts.filter((product) =>
      ["Outdoor Plants", "Lawn Grass"].includes(product.category),
    ),
  },
  {
    eyebrow: "Soft texture for shaded corners",
    title: "Fern collection spotlight",
    products: latestProducts.filter((product) => product.category === "Ferns"),
  },
];

function ProductGridSection({ eyebrow, title, products }: ProductSection) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="px-2 md:px-6">
      <div className="mx-auto max-w-7xl p-0 md:p-2">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            {/* <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b8b58] md:text-xs">
              {eyebrow}
            </p> */}
            <span className="theme-section-title  text-xl font-black tracking-[-0.05em] md:mt-3 md:text-3xl">
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

export default function HomePage() {
  return (
    <div className="space-y-4 pb-24 pt-0 md:pb-12 md:pt-0">
      <CategorySection />
      <HomeSlider />

      {productSections.map((section) => (
        <ProductGridSection
          key={section.title}
          eyebrow={section.eyebrow}
          title={section.title}
          products={section.products}
        />
      ))}
    </div>
  );
}
