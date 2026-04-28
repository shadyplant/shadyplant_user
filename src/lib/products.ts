import { getApiBaseUrl } from "@/lib/api";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  packLabel: string;
  unit: string;
  badge: string;
  description: string;
  image: string;
  images: string[];
};

type ProductApi = Omit<Product, "image" | "images"> & {
  image?: string;
  images?: string[];
};

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

  return {
    ...product,
    image: images[0] || "",
    images,
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
