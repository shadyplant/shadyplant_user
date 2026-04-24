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

export function getProductById(id: string) {
  return latestProducts.find((product) => product.id === id);
}
