export type CatalogCategory = {
  title: string;
  description: string;
  items: string[];
  accent: string;
};

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
};

export type CartItem = {
  productId: string;
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

export const latestProducts: Product[] = [
  {
    id: "areca-palm",
    name: "Areca Palm",
    category: "Indoor Plants",
    price: 499,
    packLabel: "Pack of 1",
    unit: "per plant",
    badge: "Best Seller",
    description: "Bright, pet-friendly foliage for living rooms, lobbies, and balcony corners.",
    image:
      "https://www.ugaoo.com/cdn/shop/files/medium-gropot-ivory-areca-palm-plant-32515461578884.jpg?v=1755585947",
  },
  {
    id: "snake-plant",
    name: "Snake Plant Laurentii",
    category: "Indoor Plants",
    price: 349,
    packLabel: "Pack of 1",
    unit: "per plant",
    badge: "Low Maintenance",
    description: "A hardy starter plant that works well for bedrooms and office desks.",
    image:
      "https://nurserylive.com/cdn/shop/products/nurserylive-g-snake-plant-sansevieria-trifasciata-sansevieria-zeylanica-plant.jpg?v=1635748577",
  },
  {
    id: "hibiscus-red",
    name: "Red Hibiscus",
    category: "Outdoor Plants",
    price: 299,
    packLabel: "Pack of 200",
    unit: "per plant",
    badge: "Flowering Pick",
    description: "Sun-loving color for gates, terraces, and boundary planting.",
    image:
      "https://images.meesho.com/images/products/616243172/itgky_512.webp?width=512",
  },
  {
    id: "korean-grass",
    name: "Korean Lawn Grass",
    category: "Lawn Grass",
    price: 45,
    packLabel: "Pack of 50 sqft",
    unit: "per sqft",
    badge: "Fresh Cut",
    description: "Dense, soft lawn grass suited for premium residential installations.",
    image:
      "https://syedgarden.in/wp-content/uploads/2022/08/IMG-20210816-WA0011.jpg",
  },
  {
    id: "doob-grass",
    name: "Doob Grass Rolls",
    category: "Lawn Grass",
    price: 28,
    packLabel: "Pack of 100 sqft",
    unit: "per sqft",
    badge: "Value Pick",
    description: "Durable lawn option for parks, pathways, and family-use garden areas.",
    image:
      "https://images.jdmagicbox.com/quickquotes/images_main/mexican-grass-ppehmvru.jpg",
  },
  {
    id: "boston-fern",
    name: "Boston Fern",
    category: "Ferns",
    price: 399,
    packLabel: "Pack of 1",
    unit: "per plant",
    badge: "Shade Friendly",
    description: "Soft fern foliage for hanging baskets, patios, and layered corners.",
    image:
      "https://m.media-amazon.com/images/I/718W4pJvnOL.jpg",
  },
];

export const orderHighlights = [
  "Same-day dispatch on ready nursery stock",
  "Plant-safe packaging for transit durability",
  "WhatsApp support for bulk and gifting orders",
];

export const cartItems: CartItem[] = [
  { productId: "areca-palm", quantity: 2 },
  { productId: "korean-grass", quantity: 120 },
  { productId: "boston-fern", quantity: 1 },
];

export const customerOrders: CustomerOrder[] = [
  {
    id: "order-001",
    orderNumber: "GGN-240421",
    placedAt: "24 Apr 2026, 11:20 AM",
    etaLabel: "Expected today by 7:30 PM",
    status: "Out for Delivery",
    paymentStatus: "Paid",
    total: 5649,
    trackingNumber: "TRK93821144",
    deliveryPartner: "GreenFleet Express",
    address: "House 18, Hajo Road, Guwahati, Assam 781001",
    items: [
      { productId: "korean-grass", quantity: 120 },
      { productId: "areca-palm", quantity: 1 },
    ],
    timeline: [
      {
        label: "Order confirmed",
        timestamp: "24 Apr 2026, 11:20 AM",
        completed: true,
        note: "Payment received and order approved.",
      },
      {
        label: "Packed at nursery",
        timestamp: "24 Apr 2026, 1:05 PM",
        completed: true,
        note: "Items packed with transit-safe handling.",
      },
      {
        label: "Out for delivery",
        timestamp: "24 Apr 2026, 4:10 PM",
        completed: true,
        note: "Driver is on route to your address.",
      },
      {
        label: "Delivered",
        timestamp: "Pending",
        completed: false,
        note: "Awaiting doorstep handoff confirmation.",
      },
    ],
  },
  {
    id: "order-002",
    orderNumber: "GGN-240318",
    placedAt: "18 Apr 2026, 9:45 AM",
    etaLabel: "Delivered on 19 Apr 2026",
    status: "Delivered",
    paymentStatus: "Paid",
    total: 1247,
    trackingNumber: "TRK92811032",
    deliveryPartner: "LeafLine Couriers",
    address: "Flat 4B, Zoo Road, Guwahati, Assam 781024",
    items: [
      { productId: "areca-palm", quantity: 1 },
      { productId: "boston-fern", quantity: 1 },
      { productId: "snake-plant", quantity: 1 },
    ],
    timeline: [
      {
        label: "Order confirmed",
        timestamp: "18 Apr 2026, 9:45 AM",
        completed: true,
        note: "Your order was placed successfully.",
      },
      {
        label: "Packed at nursery",
        timestamp: "18 Apr 2026, 12:10 PM",
        completed: true,
        note: "Plants were checked and packed.",
      },
      {
        label: "Out for delivery",
        timestamp: "19 Apr 2026, 9:05 AM",
        completed: true,
        note: "Courier picked up the shipment.",
      },
      {
        label: "Delivered",
        timestamp: "19 Apr 2026, 1:18 PM",
        completed: true,
        note: "Order delivered successfully.",
      },
    ],
  },
  {
    id: "order-003",
    orderNumber: "GGN-240412",
    placedAt: "22 Apr 2026, 5:15 PM",
    etaLabel: "Estimated dispatch tomorrow",
    status: "Packed",
    paymentStatus: "Cash on Delivery",
    total: 997,
    trackingNumber: "TRK93110228",
    deliveryPartner: "Nursery Van Dispatch",
    address: "Lane 6, Beltola, Guwahati, Assam 781028",
    items: [
      { productId: "hibiscus-red", quantity: 2 },
      { productId: "boston-fern", quantity: 1 },
    ],
    timeline: [
      {
        label: "Order confirmed",
        timestamp: "22 Apr 2026, 5:15 PM",
        completed: true,
        note: "Order captured with cash on delivery.",
      },
      {
        label: "Packed at nursery",
        timestamp: "23 Apr 2026, 11:35 AM",
        completed: true,
        note: "Shipment prepared for route allocation.",
      },
      {
        label: "Out for delivery",
        timestamp: "Pending",
        completed: false,
        note: "Waiting for vehicle assignment.",
      },
      {
        label: "Delivered",
        timestamp: "Pending",
        completed: false,
        note: "Will update after successful delivery.",
      },
    ],
  },
];

export function getProductById(id: string) {
  return latestProducts.find((product) => product.id === id);
}
