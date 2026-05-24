export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: string;
  coverImage: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-choose-carpet-grass-for-your-home",
    title: "How to Choose the Right Carpet Grass for Your Home Lawn",
    excerpt:
      "A simple guide to picking fresh, dense, and durable carpet grass that matches your site conditions and maintenance goals.",
    category: "Buying Guide",
    readTime: "4 min read",
    publishedAt: "April 13, 2026",
    author: "Grass Green Nursery Team",
    coverImage:
      "https://static.vecteezy.com/system/resources/previews/024/521/001/non_2x/natural-grass-turfs-installation-by-garden-worker-photo.jpeg",
    sections: [
      {
        heading: "Start With the Site Conditions",
        paragraphs: [
          "Before choosing any carpet grass, look at how much sunlight the lawn gets, how quickly water drains, and how much daily foot traffic the area receives. A front lawn, rooftop patch, and commercial entry area all perform differently even if they look similar in size.",
          "Healthy lawn results usually come from matching the grass quality and cutting style to the site instead of only comparing price per square foot.",
        ],
      },
      {
        heading: "Check Freshness Before Delivery",
        paragraphs: [
          "Good carpet grass should feel moist, look dense, and show an even green tone without large dry patches. If the rolls or pieces have been sitting too long after cutting, establishment becomes slower and patchiness becomes more likely.",
          "Ask your supplier how recently the grass was cut, how it is packed, and how fast it can be moved to your location.",
        ],
      },
      {
        heading: "Think Beyond the First Day",
        paragraphs: [
          "The best buy is not always the cheapest one. Dense grass with reliable delivery saves money later because it settles faster, looks better earlier, and usually needs less correction after installation.",
        ],
      },
    ],
  },
  {
    slug: "lawn-grass-installation-tips-for-faster-rooting",
    title: "Lawn Grass Installation Tips for Faster Rooting and Better Finish",
    excerpt:
      "Small installation decisions make a big difference in how quickly fresh carpet grass settles and turns into a clean green lawn.",
    category: "Installation",
    readTime: "5 min read",
    publishedAt: "April 11, 2026",
    author: "Grass Green Nursery Team",
    coverImage:
      "https://balajinursery.org/wp-content/uploads/2024/09/natural-grass-turf-installer-scaled.jpg",
    sections: [
      {
        heading: "Prepare the Base Properly",
        paragraphs: [
          "The soil should be level, loose enough for roots to catch, and free from stones, weeds, and construction debris. If the base is uneven, the finished lawn will show dips and dry edges even when the grass itself is good.",
          "Light compaction followed by final leveling usually gives the cleanest result before laying the pieces.",
        ],
      },
      {
        heading: "Lay the Grass Tight",
        paragraphs: [
          "Keep the joints close so the lawn reads as one surface. Gaps between pieces dry out quickly and can make the final lawn look segmented instead of premium.",
          "After placing the grass, press it gently into the prepared base so the roots have better soil contact from day one.",
        ],
      },
      {
        heading: "Water Early and Consistently",
        paragraphs: [
          "Freshly laid carpet grass needs steady moisture in the early days. The goal is not flooding the area, but keeping the root zone consistently supportive until the grass starts bonding with the ground.",
        ],
      },
    ],
  },
  {
    slug: "bulk-grass-supply-for-builders-and-large-projects",
    title: "Bulk Grass Supply Planning for Builders and Large Landscape Projects",
    excerpt:
      "When the project is large, planning delivery flow, handling, and staging matters just as much as choosing the grass itself.",
    category: "Project Planning",
    readTime: "6 min read",
    publishedAt: "April 8, 2026",
    author: "Grass Green Nursery Team",
    coverImage:
      "https://static.vecteezy.com/system/resources/thumbnails/070/255/453/small/workers-installing-rolled-sod-on-sunny-day-in-residential-garden-wearing-protective-gloves-and-helmets-creating-fresh-green-lawn-with-teamwork-and-care-free-photo.jpeg",
    sections: [
      {
        heading: "Estimate Quantity With Buffer",
        paragraphs: [
          "Large sites should always be measured with a practical buffer for trimming, edge adjustment, and unforeseen site variation. Ordering too tightly can delay completion if matching stock is not immediately available.",
        ],
      },
      {
        heading: "Coordinate Delivery Windows",
        paragraphs: [
          "Fresh grass performs best when unloading, staging, and laying are coordinated. On bigger sites, delivery should align with manpower and installation progress so material does not sit too long in stacks.",
          "This is especially important in warmer conditions where exposure time can affect freshness.",
        ],
      },
      {
        heading: "Choose a Supplier With Project Discipline",
        paragraphs: [
          "For bulk work, consistency matters more than promises. A dependable supplier should be able to maintain quality, communicate clearly on transport timing, and support repeat deliveries when the project is executed in phases.",
        ],
      },
    ],
  },
  {
    slug: "caring-for-your-new-carpet-grass-lawn",
    title: "Caring for Your New Carpet Grass Lawn: Essential Tips for a Lush Green Yard",
    excerpt:
      "After installation, the right care routine helps your carpet grass lawn establish quickly and stay healthy for years.",
    category: "Lawn Care",
    readTime: "5 min read",
    publishedAt: "April 6, 2026",
    author: "Grass Green Nursery Team",
    coverImage:
      "https://images.unsplash.com/photo-1504805572947-34fad45aed93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
    sections: [
      {
        heading: "Watering Routine",
        paragraphs: [
          "In the first few weeks, keep the soil consistently moist but not waterlogged. Water early in the morning or late in the evening to reduce evaporation and help the roots absorb moisture effectively.",
        ],
      },
    ],
  }
];

export function getAllBlogSlugs() {
  return blogPosts.map((post) => post.slug);
}

export function getBlogBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
