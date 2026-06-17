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
  variety: string;
  containerSize: string;
  height: string;
  price: number;
  mrp: number;
  weight: number;
  offer: string;
  minOrderQuantity: number;
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
};

export type ProductDetailSection = {
  title: string;
  description: string;
  sortOrder: number;
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

type ProductApi = Omit<Product, "image" | "images" | "usesImages" | "videoClips"> & {
  image?: string;
  images?: string[];
  usesImages?: string[];
  videoClips?: Array<Partial<ProductVideoClip> & { image?: string }>;
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

  return {
    ...product,
    productId: String(product.productId || product.id || "").trim(),
    variety: String(product.variety || "").trim(),
    containerSize: String(product.containerSize || "").trim(),
    height: String(product.height || "").trim(),
    mrp: Math.max(Number(product.mrp || 0), Number(product.price || 0)),
    weight: Number(product.weight) > 0 ? Number(product.weight) : 0,
    offer: String(product.offer || "").trim(),
    minOrderQuantity:
      Number(product.minOrderQuantity) > 0 ? Number(product.minOrderQuantity) : 1,
    stock: Math.max(0, Math.floor(Number(product.stock || 0))),
    isOnTrend: Boolean(product.isOnTrend),
    isFeaturedLatest: Boolean(product.isFeaturedLatest),
    image: images[0] || "",
    images,
    usesImages,
    tags,
    optionGroups: normalizeProductOptionGroups(product.optionGroups),
    detailSections: normalizeProductDetailSections(product.detailSections),
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

  return response.data.products.map(normalizeProduct);
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
