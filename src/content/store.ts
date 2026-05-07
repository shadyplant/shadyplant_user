export type CatalogCategory = {
  title: string;
  description: string;
  items: string[];
  accent: string;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  variantLabel?: string;
  packLabel?: string;
  unitPrice?: number | null;
  unitMrp?: number | null;
  optionSelections?: Array<{
    groupKey: string;
    optionKey: string;
    label?: string;
    groupTitle?: string;
  }>;
  quantity: number;
};

export type OrderStatus =
  | "Order Confirmed"
  | "Packed"
  | "Out for Delivery"
  | "Delivered";

export type PaymentStatus = "Paid" | "Cash on Delivery";

export type OrderTimelineEvent = {
  label: string;
  timestamp: string;
  completed: boolean;
  note: string;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  placedAt: string;
  etaLabel: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  trackingNumber: string;
  deliveryPartner: string;
  address: string;
  items: CartItem[];
  timeline: OrderTimelineEvent[];
};

export const categoryBar = [
  "Indoor Plants",
  "Outdoor Plants",
  "Lawn Grass",
  "Ferns",
  "Planters",
  "Fertilizers",
  "Garden Tools",
  "Offers",
] as const;

export const catalogCategories: CatalogCategory[] = [
  {
    title: "Plants",
    description: "Build a greener home with easy-care foliage and statement plants.",
    items: ["Outdoor Plants", "Indoor Plants", "Flowering Plants", "Air Purifying Plants"],
    accent: "from-[#153f18] via-[#2f6a2c] to-[#7ca93a]",
  },
  {
    title: "Lawns",
    description: "Fresh grass and fern-friendly textures for compact gardens and larger sites.",
    items: ["Korean Grass", "Doob Grass", "Mexican Lawn Grass", "Boston Fern Borders"],
    accent: "from-[#305f18] via-[#568927] to-[#b7d96a]",
  },
  {
    title: "Pots and Decor",
    description: "Pots, pebbles, and accessories that help plants look merchandised, not just placed.",
    items: ["Ceramic Pots", "Hanging Baskets", "Self-Watering Planters", "Garden Stones"],
    accent: "from-[#51361f] via-[#8c633f] to-[#d5bb93]",
  },
];

export const orderHighlights = [
  "Same-day dispatch on ready nursery stock",
  "Plant-safe packaging for transit durability",
  "WhatsApp support for bulk and gifting orders",
];

