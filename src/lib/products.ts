import { getApiBaseUrl } from "@/lib/api";
import {
  resolveProductVideoClips,
  type ProductVideoClip,
} from "@/lib/productMedia";

export type Product = {
  id: string;
  productId: string;
  name: string;
  category: string;
  sku: string;
  skuId: string;
  hsnCode: string;
  variety: string;
  containerSize: string;
  height: string;
  potMaterial: string;
  leafColor: string;
  flowerColor: string;
  lightRequirement: string;
  waterRequirement: string;
  plantPlacement: string;
  usageArea: string;
  plantAgeMonths: number | null;
  productionCapacity: number | null;
  packagingDetails: string;
  growthSpeed: string;
  countryOfOrigin: string;
  manufacturedBy: string;
  marketedBy: string;
  price: number;
  mrp: number;
  weight: number;
  offer: string;
  minOrderQuantity: number;
  maxPurchaseQuantity: number | null;
  stock: number;
  isOnTrend: boolean;
  isFeaturedLatest: boolean;
  packLabel: string;
  unit: string;
  badge: string;
  description: string;
  image: string;
  images: string[];
  usesImages: string[];
  tags: string[];
  videoClips: ProductVideoClip[];
  optionGroups: ProductOptionGroup[];
  detailSections: ProductDetailSection[];
  quantityPricingSlabs: ProductQuantityPricingSlab[];
};

export type ProductDetailSection = {
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
};

export type ProductQuantityPricingSlab = {
  key: string;
  label: string;
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number;
  note: string;
};

export type ProductOption = {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  note: string;
  price: number | null;
  mrp: number | null;
  stock: number | null;
  packLabel: string;
  weight: number | null;
  isDefault: boolean;
  isDisabled: boolean;
};

export type ProductOptionGroup = {
  key: string;
  title: string;
  subtitle: string;
  guideLabel: string;
  options: ProductOption[];
};

type ProductApi = Omit<
  Product,
  "image" | "images" | "usesImages" | "videoClips" | "quantityPricingSlabs"
> & {
  image?: string;
  images?: string[];
  usesImages?: string[];
  videoClips?: Array<Partial<ProductVideoClip> & { image?: string }>;
  quantityPricingSlabs?: Array<Partial<ProductQuantityPricingSlab>>;
  min_order_quantity?: number;
  minimumOrderQuantity?: number;
  minQuantity?: number;
  minQty?: number;
  max_purchase_quantity?: number;
  maximumPurchaseQuantity?: number;
  maxQuantity?: number;
  maxQty?: number;
};

function normalizeProductDetailSections(
  detailSections: unknown,
): ProductDetailSection[] {
  if (!Array.isArray(detailSections)) {
    return [];
  }

  return detailSections
    .map((section, index) => {
      if (!section || typeof section !== "object") {
        return null;
      }

      const rawSection = section as Partial<ProductDetailSection>;
      const title = String(rawSection.title || "").trim();
      const description = String(rawSection.description || "").trim();

      if (!title || !description) {
        return null;
      }

      return {
        title,
        description,
        icon: String(rawSection.icon || "").trim(),
        sortOrder: Number.isFinite(Number(rawSection.sortOrder))
          ? Math.max(0, Math.floor(Number(rawSection.sortOrder)))
          : index,
      };
    })
    .filter((section): section is ProductDetailSection => Boolean(section))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function normalizeOptionValue(value: unknown) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function normalizePositiveInteger(value: unknown) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? Math.floor(parsedValue)
    : null;
}

function resolveMinimumOrderQuantity(
  product: Pick<
    ProductApi,
    | "minOrderQuantity"
    | "min_order_quantity"
    | "minimumOrderQuantity"
    | "minQuantity"
    | "minQty"
  >,
  quantityPricingSlabs: ProductQuantityPricingSlab[],
) {
  const explicitMinimum =
    normalizePositiveInteger(product.minOrderQuantity) ??
    normalizePositiveInteger(product.min_order_quantity) ??
    normalizePositiveInteger(product.minimumOrderQuantity) ??
    normalizePositiveInteger(product.minQuantity) ??
    normalizePositiveInteger(product.minQty);

  const slabMinimum = quantityPricingSlabs.length
    ? quantityPricingSlabs.reduce(
        (smallest, slab) => Math.min(smallest, slab.minQuantity),
        quantityPricingSlabs[0].minQuantity,
      )
    : null;

  return Math.max(1, explicitMinimum ?? 1, slabMinimum ?? 1);
}

export type ProductQuantityBounds = {
  minimumQuantity: number;
  maximumQuantity: number | null;
};

export function resolveProductQuantityBounds(
  product: Pick<
    Product,
    "minOrderQuantity" | "maxPurchaseQuantity"
  >,
  availableStock?: number | null,
  options?: {
    serverMaximumQuantity?: number | null;
  },
): ProductQuantityBounds {
  const minimumQuantity = Math.max(
    1,
    Math.floor(Number(product.minOrderQuantity || 1)),
  );
  const productMaximumQuantity =
    product.maxPurchaseQuantity === null ||
    product.maxPurchaseQuantity === undefined
      ? null
      : Math.max(1, Math.floor(Number(product.maxPurchaseQuantity)));
  const stockMaximumQuantity =
    availableStock === null || availableStock === undefined
      ? null
      : Math.max(0, Math.floor(Number(availableStock)));
  const serverMaximumQuantity =
    options?.serverMaximumQuantity === null ||
    options?.serverMaximumQuantity === undefined
      ? null
      : Math.max(1, Math.floor(Number(options.serverMaximumQuantity)));
  const quantityCandidates = [
    productMaximumQuantity,
    stockMaximumQuantity,
    serverMaximumQuantity,
  ].filter((value): value is number => value !== null && value > 0);
  const maximumQuantity = quantityCandidates.length
    ? Math.min(...quantityCandidates)
    : null;

  return {
    minimumQuantity:
      maximumQuantity !== null
        ? Math.min(minimumQuantity, maximumQuantity)
        : minimumQuantity,
    maximumQuantity,
  };
}

export function clampProductQuantity(
  quantity: number,
  bounds: ProductQuantityBounds,
) {
  const normalizedQuantity = Math.max(
    bounds.minimumQuantity,
    Math.floor(Number(quantity || bounds.minimumQuantity)),
  );

  return bounds.maximumQuantity === null
    ? normalizedQuantity
    : Math.min(bounds.maximumQuantity, normalizedQuantity);
}

function formatOptionValue(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function buildOptionLabel(option: Partial<ProductOption>) {
  const explicitLabel = String(option.label || "").trim();

  if (explicitLabel) {
    return explicitLabel;
  }

  const normalizedValue = normalizeOptionValue(option.value);
  const normalizedUnit = String(option.unit || "").trim();

  if (normalizedValue !== null && normalizedUnit) {
    return `${formatOptionValue(normalizedValue)} ${normalizedUnit}`;
  }

  if (normalizedValue !== null) {
    return formatOptionValue(normalizedValue);
  }

  return "";
}

function normalizeProductOptionGroups(
  optionGroups: unknown,
): ProductOptionGroup[] {
  if (!Array.isArray(optionGroups)) {
    return [];
  }

  return optionGroups
    .map((group, groupIndex) => {
      if (!group || typeof group !== "object") {
        return null;
      }

      const rawGroup = group as Partial<ProductOptionGroup>;
      const title = String(rawGroup.title || "").trim();
      const options = Array.isArray(rawGroup.options)
        ? rawGroup.options
            .map((option, optionIndex) => {
              if (!option || typeof option !== "object") {
                return null;
              }

              const rawOption = option as Partial<ProductOption>;
              const label = buildOptionLabel(rawOption);
              const key =
                String(rawOption.key || "").trim() ||
                label ||
                `option-${optionIndex + 1}`;
              const normalizedPrice = normalizeOptionValue(
                (rawOption as Partial<ProductOption>).price,
              );
              const normalizedMrp = normalizeOptionValue(
                (rawOption as Partial<ProductOption>).mrp,
              );

              return {
                key,
                label,
                unit: String(rawOption.unit || "").trim(),
                value: normalizeOptionValue(rawOption.value),
                note: String(rawOption.note || "").trim(),
                price: normalizedPrice,
                mrp:
                  normalizedPrice === null && normalizedMrp === null
                    ? null
                    : Math.max(normalizedMrp ?? 0, normalizedPrice ?? 0),
                stock: normalizeOptionValue(
                  (rawOption as Partial<ProductOption>).stock,
                ),
                packLabel: String(
                  (rawOption as Partial<ProductOption>).packLabel || "",
                ).trim(),
                weight: normalizeOptionValue(
                  (rawOption as Partial<ProductOption>).weight,
                ),
                isDefault: Boolean(rawOption.isDefault),
                isDisabled:
                  Boolean(rawOption.isDisabled) ||
                  normalizeOptionValue((rawOption as Partial<ProductOption>).stock) === 0,
              };
            })
            .filter((option): option is ProductOption => Boolean(option?.label))
        : [];

      if (!title || !options.length) {
        return null;
      }

      const normalizedOptions = options.map((option) => ({
        ...option,
        isDefault: false,
      }));
      const selectedIndex = options.findIndex(
        (option) => option.isDefault && !option.isDisabled,
      );
      const fallbackIndex = options.findIndex((option) => !option.isDisabled);
      const resolvedIndex =
        selectedIndex >= 0 ? selectedIndex : fallbackIndex >= 0 ? fallbackIndex : 0;

      if (normalizedOptions[resolvedIndex]) {
        normalizedOptions[resolvedIndex].isDefault = true;
      }

      return {
        key: String(rawGroup.key || "").trim() || `group-${groupIndex + 1}`,
        title,
        subtitle: String(rawGroup.subtitle || "").trim(),
        guideLabel: String(rawGroup.guideLabel || "").trim(),
        options: normalizedOptions,
      };
    })
    .filter((group): group is ProductOptionGroup => Boolean(group));
}

type ProductListResponse = {
  message: string;
  data: {
    products: ProductApi[];
  };
};

type ProductDetailsResponse = {
  message: string;
  data: {
    product: ProductApi;
  };
};

type LawnGrassPageProductResponse = {
  message: string;
  data: {
    productId: string;
    product: ProductApi | null;
    updatedAt: string | null;
    updatedByStaffAccountId: string | null;
  };
};

function normalizeProduct(product: ProductApi): Product {
  const images = [...new Set(
    [product.image, ...(Array.isArray(product.images) ? product.images : [])]
      .map((image) => String(image || "").trim())
      .filter(Boolean),
  )];
  const usesImages = [...new Set(
    (Array.isArray(product.usesImages) ? product.usesImages : [])
      .map((image) => String(image || "").trim())
      .filter(Boolean),
  )];
  const tags = Array.isArray(product.tags)
    ? [...new Set(product.tags.map((tag) => String(tag || "").trim()).filter(Boolean))]
    : [];
  const quantityPricingSlabs = Array.isArray(product.quantityPricingSlabs)
    ? product.quantityPricingSlabs
        .map((slab, index) => {
          if (!slab || typeof slab !== "object") {
            return null;
          }

          const rawSlab = slab as Partial<ProductQuantityPricingSlab>;
          const minQuantity = Math.max(
            1,
            Math.floor(Number(rawSlab.minQuantity || 1)),
          );
          const maxQuantity =
            rawSlab.maxQuantity === null || rawSlab.maxQuantity === undefined
              ? null
              : Math.max(minQuantity, Math.floor(Number(rawSlab.maxQuantity)));
          const pricePerUnit = Number(rawSlab.pricePerUnit);
          const label =
            String(rawSlab.label || "").trim() ||
            (maxQuantity !== null ? `${minQuantity}-${maxQuantity}` : `${minQuantity}+`);

          if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
            return null;
          }

          return {
            key: String(rawSlab.key || label || `slab-${index + 1}`).trim(),
            label,
            minQuantity,
            maxQuantity,
            pricePerUnit,
            note: String(rawSlab.note || "").trim(),
          };
        })
        .filter((slab): slab is ProductQuantityPricingSlab => Boolean(slab))
    : [];

  return {
    ...product,
    productId: String(product.productId || product.id || "").trim(),
    sku: String(product.sku || "").trim(),
    skuId: String(product.skuId || "").trim(),
    hsnCode: String(product.hsnCode || "").trim(),
    variety: String(product.variety || "").trim(),
    containerSize: String(product.containerSize || "").trim(),
    height: String(product.height || "").trim(),
    potMaterial: String(product.potMaterial || "").trim(),
    leafColor: String(product.leafColor || "").trim(),
    flowerColor: String(product.flowerColor || "").trim(),
    lightRequirement: String(product.lightRequirement || "").trim(),
    waterRequirement: String(product.waterRequirement || "").trim(),
    plantPlacement: String(product.plantPlacement || "").trim(),
    usageArea: String(product.usageArea || "").trim(),
    plantAgeMonths:
      product.plantAgeMonths === null || product.plantAgeMonths === undefined
        ? null
        : Math.max(0, Math.floor(Number(product.plantAgeMonths))),
    productionCapacity:
      product.productionCapacity === null || product.productionCapacity === undefined
        ? null
        : Math.max(0, Math.floor(Number(product.productionCapacity))),
    packagingDetails: String(product.packagingDetails || "").trim(),
    growthSpeed: String(product.growthSpeed || "").trim(),
    countryOfOrigin: String(product.countryOfOrigin || "").trim(),
    manufacturedBy: String(product.manufacturedBy || "").trim(),
    marketedBy: String(product.marketedBy || "").trim(),
    mrp: Math.max(Number(product.mrp || 0), Number(product.price || 0)),
    weight: Number(product.weight) > 0 ? Number(product.weight) : 0,
    offer: String(product.offer || "").trim(),
    minOrderQuantity: resolveMinimumOrderQuantity(product, quantityPricingSlabs),
    maxPurchaseQuantity:
      normalizePositiveInteger(product.maxPurchaseQuantity) ??
      normalizePositiveInteger(product.max_purchase_quantity) ??
      normalizePositiveInteger(product.maximumPurchaseQuantity) ??
      normalizePositiveInteger(product.maxQuantity) ??
      normalizePositiveInteger(product.maxQty),
    stock: Math.max(0, Math.floor(Number(product.stock || 0))),
    isOnTrend: Boolean(product.isOnTrend),
    isFeaturedLatest: Boolean(product.isFeaturedLatest),
    image: images[0] || "",
    images,
    usesImages,
    tags,
    optionGroups: normalizeProductOptionGroups(product.optionGroups),
    detailSections: normalizeProductDetailSections(product.detailSections),
    quantityPricingSlabs,
    videoClips: resolveProductVideoClips({
      id: String(product.id || "").trim(),
      productId: String(product.productId || product.id || "").trim(),
      name: String(product.name || "").trim(),
      category: String(product.category || "").trim(),
      image: images[0] || "",
      images,
      videoClips: Array.isArray(product.videoClips) ? product.videoClips : [],
    }),
  };
}

const fetchJson = async <T>(url: string) => {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch ${url}.`);
  }

  return (await response.json()) as T;
};

export async function fetchProducts(query?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();

  const response = await fetchJson<ProductListResponse>(
    `${getApiBaseUrl()}/products${queryString ? `?${queryString}` : ""}`,
  );

  const products = response.data.products.map(normalizeProduct);

  return products;
}

export async function fetchProductById(productId: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/products/${encodeURIComponent(productId)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Unable to fetch product ${productId}.`);
  }

  const payload = (await response.json()) as ProductDetailsResponse;
  return normalizeProduct(payload.data.product);
}

export async function fetchLawnGrassPageProduct() {
  const response = await fetchJson<LawnGrassPageProductResponse>(
    `${getApiBaseUrl()}/lawn-grass-page`,
  );

  return response.data.product ? normalizeProduct(response.data.product) : null;
}
