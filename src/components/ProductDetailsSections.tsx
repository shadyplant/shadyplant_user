import { ChevronDown } from "lucide-react";
import type { Product, ProductDetailSection } from "@/lib/products";

type ProductHighlight = {
  label: string;
  value: string;
};

type ProductAccordion = {
  title: string;
  description: string;
};

export type ProductExperience = {
  highlights: ProductHighlight[];
  accordions: ProductAccordion[];
};

function getProductHighlights(product: Product): ProductHighlight[] {
  const highlights = [
    { label: "Category", value: product.category || "Not set" },
    { label: "Unit", value: product.unit || "Not set" },
    { label: "Pack label", value: product.packLabel || "Not set" },
    { label: "Tags", value: product.tags.length ? product.tags.slice(0, 2).join(", ") : "Not set" },
  ];

  if (Number.isFinite(product.price)) {
    highlights.splice(1, 0, { label: "Price", value: `₹${product.price}` });
  }

  if (Number.isFinite(product.stock)) {
    highlights.splice(2, 0, { label: "Stock", value: String(product.stock) });
  }

  return highlights.slice(0, 4);
}

function getProductAccordions(product: Product): ProductAccordion[] {
  return Array.isArray(product.detailSections)
    ? product.detailSections
        .map((section: ProductDetailSection) => ({
          title: section.title,
          description: section.description,
        }))
        .filter((section) => section.title.trim() && section.description.trim())
    : [];
}

export function getProductExperience(product: Product): ProductExperience {
  return {
    highlights: getProductHighlights(product),
    accordions: getProductAccordions(product),
  };
}

export default function ProductDetailsSections({ product }: { product: Product }) {
  const experience = getProductExperience(product);

  return (
    <div className="space-y-10">
      <section className="rounded-[2.2rem] border border-[#d6e6bd] bg-white p-6 shadow-[0_24px_56px_rgba(33,79,20,0.06)] md:p-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6b8b58]">
              Key highlights
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#163915] md:text-4xl">
              Product details from the admin panel
            </h2>

            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {experience.highlights.map((item) => (
                <div key={item.label} className="border-b border-[#e6eedc] pb-4">
                  <p className="text-sm text-[#7a8f6f]">{item.label}</p>
                  <p className="mt-2 text-xl font-bold text-[#163915]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {experience.accordions.length ? (
              experience.accordions.map((item) => (
                <details
                  key={item.title}
                  className="group rounded-[1.6rem] border border-[#d8e6cb] bg-[#f9fcf5] p-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-[#163915]">{item.title}</p>
                      <p className="mt-1 text-sm text-[#6d8464]">
                        {item.description.split(/\r?\n/)[0]}
                      </p>
                    </div>
                    <ChevronDown
                      className="text-[#5d7b56] transition group-open:rotate-180"
                      size={20}
                    />
                  </summary>

                  <div className="mt-4 space-y-3 border-t border-[#e3edd7] pt-4">
                    {item.description
                      .split(/\r?\n/)
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => (
                        <p key={line} className="text-sm leading-7 text-[#58724f]">
                          {line}
                        </p>
                      ))}
                  </div>
                </details>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-[#d8e6cb] bg-[#f9fcf5] p-5 text-sm text-[#6d8464]">
                No product detail sections have been added yet from the admin panel.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
