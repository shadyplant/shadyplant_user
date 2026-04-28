export type CatalogCategory = {
  title: string;
  description: string;
  items: string[];
  accent: string;
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
