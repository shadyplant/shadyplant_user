export type ProductVideoClip = {
  id: string;
  title: string;
  poster: string;
  src?: string;
  views?: string;
  products?: number;
  isVideo?: boolean;
};

type ProductVideoClipInput = Partial<ProductVideoClip> & {
  image?: string;
};

type ProductMediaSeed = Omit<ProductVideoClipInput, "poster" | "image"> & {
  posterIndex?: number;
};

type ResolveProductVideoClipsInput = {
  id: string;
  productId: string;
  name: string;
  category: string;
  image?: string;
  images?: string[];
  videoClips?: ProductVideoClipInput[];
};

const CATEGORY_VIDEO_CLIP_SEEDS: Record<string, ProductMediaSeed[]> = {
  "lawn grass": [
    {
      id: "fresh-installation",
      title: "Fresh installation at a real home lawn",
      views: "14.8K",
      products: 1,
      posterIndex: 0,
      isVideo: true,
    },
    {
      id: "watering-finish",
      title: "Watering and finish look after laying",
      views: "9.2K",
      products: 1,
      posterIndex: 1,
      isVideo: true,
    },
    {
      id: "next-day-view",
      title: "Next-day view after installation",
      views: "6.7K",
      products: 1,
      posterIndex: 2,
      isVideo: true,
    },
  ],
  "indoor plants": [
    {
      id: "living-room-styling",
      title: "Styled in a bright living room corner",
      views: "11.3K",
      products: 1,
      posterIndex: 0,
      isVideo: true,
    },
    {
      id: "sunlight-angle",
      title: "How the plant looks in natural daylight",
      views: "8.6K",
      products: 1,
      posterIndex: 1,
      isVideo: true,
    },
  ],
  ferns: [
    {
      id: "fern-shelf-view",
      title: "Fern texture and shelf placement view",
      views: "7.4K",
      products: 1,
      posterIndex: 0,
      isVideo: true,
    },
    {
      id: "close-leaf-motion",
      title: "Leaf movement and healthy fullness",
      views: "5.9K",
      products: 1,
      posterIndex: 1,
      isVideo: true,
    },
  ],
};

function normalizeClip(
  clip: ProductVideoClipInput,
  index: number,
  gallery: string[],
  fallbackBaseId: string,
): ProductVideoClip | null {
  const poster =
    String(clip.poster || clip.image || gallery[index] || gallery[0] || "").trim();

  if (!poster) {
    return null;
  }

  return {
    id: String(clip.id || `${fallbackBaseId}-clip-${index + 1}`).trim(),
    title: String(clip.title || `Real life view ${index + 1}`).trim(),
    poster,
    src: String(clip.src || "").trim() || undefined,
    views: String(clip.views || "").trim() || undefined,
    products:
      typeof clip.products === "number" && Number.isFinite(clip.products)
        ? clip.products
        : undefined,
    isVideo: clip.isVideo ?? Boolean(clip.src),
  };
}

function buildSeededClips(
  seeds: ProductMediaSeed[],
  gallery: string[],
  fallbackBaseId: string,
): ProductVideoClip[] {
  return seeds
    .map((seed, index) =>
      normalizeClip(
        {
          ...seed,
          poster: gallery[seed.posterIndex ?? index] || gallery[index] || gallery[0],
        },
        index,
        gallery,
        fallbackBaseId,
      ),
    )
    .filter((clip): clip is ProductVideoClip => Boolean(clip));
}

export function resolveProductVideoClips({
  id,
  productId,
  name,
  category,
  image,
  images,
  videoClips,
}: ResolveProductVideoClipsInput): ProductVideoClip[] {
  const gallery = [...new Set([image, ...(Array.isArray(images) ? images : [])])]
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  const fallbackBaseId = String(productId || id || name || "product").trim();
  const normalizedProvidedClips = Array.isArray(videoClips)
    ? videoClips
        .map((clip, index) =>
          normalizeClip(clip, index, gallery, fallbackBaseId),
        )
        .filter((clip): clip is ProductVideoClip => Boolean(clip))
    : [];

  if (normalizedProvidedClips.length) {
    return normalizedProvidedClips;
  }

  const seededClips = buildSeededClips(
    CATEGORY_VIDEO_CLIP_SEEDS[String(category || "").trim().toLowerCase()] || [],
    gallery,
    fallbackBaseId,
  );

  if (seededClips.length) {
    return seededClips;
  }

  return gallery.slice(0, 3).map((poster, index) => ({
    id: `${fallbackBaseId}-clip-${index + 1}`,
    title: `${name} real view ${index + 1}`,
    poster,
    views: undefined,
    products: 1,
    isVideo: true,
  }));
}
