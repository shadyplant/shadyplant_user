import { ChevronDown } from "lucide-react";
import type { Product, ProductDetailSection } from "@/lib/products";

type ProductHighlight = {
  label: string;
  value: string;
};

type ProductSpecification = {
  label: string;
  value: string;
};

type ProductAccordion = {
  title: string;
  description: string;
  icon: string;
};

export type ProductExperience = {
  highlights: ProductHighlight[];
  specifications: ProductSpecification[];
  accordions: ProductAccordion[];
};

function getProductHighlights(product: Product): ProductHighlight[] {
  const highlights = [
    { label: "Category", value: product.category || "Not set" },
    { label: "Unit", value: product.unit || "Not set" },
    { label: "Pack label", value: product.packLabel || "Not set" },
    {
      label: "Tags",
      value: product.tags.length
        ? product.tags.slice(0, 2).join(", ")
        : "Not set",
    },
  ];

  if (Number.isFinite(product.price)) {
    highlights.splice(1, 0, { label: "Price", value: `₹${product.price}` });
  }

  if (Number.isFinite(product.stock)) {
    highlights.splice(2, 0, { label: "Stock", value: String(product.stock) });
  }

  return highlights.slice(0, 4);
}

function formatSpecificationValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not set";
  }

  const nextValue = String(value).trim();
  return nextValue || "Not set";
}

function getProductSpecifications(product: Product): ProductSpecification[] {
  return [
    { label: "Product name", value: formatSpecificationValue(product.name) },
    { label: "Product ID", value: formatSpecificationValue(product.productId) },
    { label: "SKU", value: formatSpecificationValue(product.sku) },
    { label: "HSN", value: formatSpecificationValue(product.hsnCode) },
    { label: "Height", value: formatSpecificationValue(product.height) },
    {
      label: "Pot size",
      value: formatSpecificationValue(product.containerSize),
    },
    {
      label: "Pot material",
      value: formatSpecificationValue(product.potMaterial),
    },
    { label: "Unit", value: formatSpecificationValue(product.unit) },
    { label: "Variety", value: formatSpecificationValue(product.variety) },
    {
      label: "Min order quantity",
      value: formatSpecificationValue(product.minOrderQuantity),
    },
    {
      label: "Production capacity",
      value: formatSpecificationValue(product.productionCapacity),
    },
    {
      label: "Plant age",
      value:
        product.plantAgeMonths !== null && product.plantAgeMonths !== undefined
          ? `${product.plantAgeMonths} Months`
          : "Not set",
    },
    {
      label: "Growth speed",
      value: formatSpecificationValue(product.growthSpeed),
    },
    {
      label: "Description",
      value: formatSpecificationValue(product.description),
    },
    {
      label: "Foilage color",
      value: formatSpecificationValue(product.leafColor),
    },
    {
      label: "Flower color",
      value: formatSpecificationValue(product.flowerColor),
    },
    {
      label: "Light requirement",
      value: formatSpecificationValue(product.lightRequirement),
    },
    {
      label: "Water requirement",
      value: formatSpecificationValue(product.waterRequirement),
    },
    {
      label: "Plant placement",
      value: formatSpecificationValue(product.plantPlacement),
    },
    { label: "Usage area", value: formatSpecificationValue(product.usageArea) },
    {
      label: "Packaging details",
      value: formatSpecificationValue(product.packagingDetails),
    },
    {
      label: "Country of origin",
      value: formatSpecificationValue(product.countryOfOrigin),
    },
    {
      label: "Manufactured by",
      value: formatSpecificationValue(product.manufacturedBy),
    },
    {
      label: "Marketed by",
      value: formatSpecificationValue(product.marketedBy),
    },
  ];
}

function getProductAccordions(product: Product): ProductAccordion[] {
  return Array.isArray(product.detailSections)
    ? product.detailSections
        .map((section: ProductDetailSection) => ({
          title: section.title,
          description: section.description,
          icon: section.icon,
        }))
        .filter((section) => section.title.trim() && section.description.trim())
    : [];
}

export function getProductExperience(product: Product): ProductExperience {
  return {
    highlights: getProductHighlights(product),
    specifications: getProductSpecifications(product),
    accordions: getProductAccordions(product),
  };
}

export default function ProductDetailsSections({
  product,
}: {
  product: Product;
}) {
  const experience = getProductExperience(product);

  return (
    <div className="space-y-6">
      <details className="group ">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1">
          <div>
            <p className="text-xs font-medium text-gray-700 md:text-sm">
              Product Specifications
            </p>
            {/* <p className="mt-1 text-sm text-gray-500 md:text-sm">
              {experience.specifications.length} specifications available
            </p> */}
          </div>
          <ChevronDown
            className="shrink-0 text-gray-500 transition group-open:rotate-180"
            size={18}
          />
        </summary>

        <div className="pb-1">
          <div className="border-t border-gray-200 pt-2">
            <div className="overflow-hidden">
              {experience.specifications.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[minmax(7rem,0.38fr)_minmax(0,0.62fr)] border-b border-gray-200 last:border-b-0 md:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)]"
                >
                  <div className="px-0 py-3 pr-3 text-[13px] font-medium leading-5 text-gray-700 md:px-0 md:pr-4 md:text-[14px]">
                    {item.label}
                  </div>
                  <div className="px-0 py-3 text-[13px] leading-5 text-gray-500 md:px-0 md:text-[14px] md:leading-6">
                    <span className="whitespace-pre-line">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      <section className="border-t border-gray-200">
        <div className="grid gap-0">
          {experience.accordions.length ? (
            experience.accordions.map((item) => (
              <details
                key={item.title}
                className="group border-b border-gray-200 last:border-b-0"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
                  <div className="flex gap-2">
                    {item.icon ? (
                      <span>
                        <img
                          src={item.icon}
                          alt={`${item.title} icon`}
                          className="h-5 w-5 md:h-6 md:w-6"
                        />
                      </span>
                    ) : null}
                    <p className="text-xs font-medium text-gray-700 md:text-xs">
                      {item.title}
                    </p>
                  </div>
                  <ChevronDown
                    className="shrink-0 text-gray-500 transition group-open:rotate-180"
                    size={18}
                  />
                </summary>

                <div className="pb-4">
                  <div className="border-t border-gray-200 pt-3">
                    <div className="space-y-1 text-[14px] leading-6 text-gray-500 md:text-xs">
                      {item.description
                        .split(/\r?\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                    </div>
                  </div>
                </div>
              </details>
            ))
          ) : (
            <div className="py-4 text-sm text-gray-500">
              {/* Keep it Empty */}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
