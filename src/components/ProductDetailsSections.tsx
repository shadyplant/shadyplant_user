import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Leaf,
  ShieldCheck,
  Sprout,
  Star,
  ThumbsUp,
  Truck,
} from "lucide-react";
import type { Product } from "@/lib/products";

type ProductHighlight = {
  label: string;
  value: string;
};

type ProductAccordion = {
  title: string;
  subtitle: string;
  content: string[];
};

type ProductReview = {
  author: string;
  location: string;
  date: string;
  rating: number;
  title: string;
  body: string;
  tag: string;
  helpfulCount: number;
};

export type ProductExperience = {
  rating: number;
  totalRatings: number;
  recommendPercent: number;
  ratingBreakdown: Array<{ stars: number; count: number }>;
  highlights: ProductHighlight[];
  accordions: ProductAccordion[];
  reviews: ProductReview[];
  reviewTags: string[];
  nurseryPromises: Array<{
    title: string;
    description: string;
    icon: typeof Leaf;
  }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSeed(productId: string) {
  return productId.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
}

function formatReviewDate(seed: number, index: number) {
  const day = String(((seed + index * 7) % 27) + 1).padStart(2, "0");
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index % 6];
  return `${day} ${month} 2026`;
}

function getCategoryContent(product: Product, seed: number) {
  const productName = product.name;

  if (product.category === "Indoor Plants") {
    return {
      highlights: [
        { label: "Light need", value: "Bright indirect light" },
        { label: "Watering", value: "Once every 5 to 7 days" },
        { label: "Placement", value: "Living room or office corner" },
        { label: "Care style", value: product.badge },
      ],
      accordions: [
        {
          title: "Product Description",
          subtitle: "Plant profile, finish, and ideal spaces",
          content: [
            `${productName} brings fresh green texture to compact indoor spaces without feeling high-maintenance.`,
            "Works especially well near windows, reception desks, reading corners, and shaded balconies.",
            "Each order is selected for healthy foliage, balanced shape, and easy settling after delivery.",
          ],
        },
        {
          title: "Care and Placement",
          subtitle: "Watering, light, and routine upkeep",
          content: [
            "Keep the soil lightly moist but never soggy, and allow the top layer to breathe between waterings.",
            "Place in filtered daylight and rotate the pot every week for even growth.",
            "Trim tired leaves occasionally and feed lightly during active growing months.",
          ],
        },
        {
          title: "Delivery and Plant Health",
          subtitle: "Dispatch support and replacement guidance",
          content: [
            "Plants are wrapped for airflow and stem protection before dispatch.",
            "If transit stress is visible on arrival, give the plant 24 to 48 hours in shade before repotting.",
            "Our support team can help with placement and watering guidance after delivery.",
          ],
        },
      ],
      reviews: [
        {
          author: "Riya Das",
          location: "Guwahati",
          date: formatReviewDate(seed, 0),
          rating: 5,
          title: "Healthy leaves right out of the box",
          body: `${productName} arrived fresh and upright. It settled nicely near my study window and still looks lush after the first week.`,
          tag: "Plant health",
          helpfulCount: 14,
        },
        {
          author: "Aniket Sharma",
          location: "Shillong",
          date: formatReviewDate(seed, 1),
          rating: 4,
          title: "Good for apartment corners",
          body: `The size matched what I expected and the foliage looked clean. It adds a calm indoor feel without demanding too much care.`,
          tag: "Room styling",
          helpfulCount: 9,
        },
        {
          author: "Megha Paul",
          location: "Silchar",
          date: formatReviewDate(seed, 2),
          rating: 5,
          title: "Beginner-friendly choice",
          body: `Packaging was neat and the plant adapted quickly. Helpful pick if you want something decorative but easy to manage.`,
          tag: "Easy care",
          helpfulCount: 11,
        },
      ],
    };
  }

  if (product.category === "Ferns") {
    return {
      highlights: [
        { label: "Light need", value: "Filtered shade" },
        { label: "Watering", value: "Keep evenly moist" },
        { label: "Humidity", value: "Likes humid air" },
        { label: "Best for", value: "Patio or hanging basket" },
      ],
      accordions: [
        {
          title: "Product Description",
          subtitle: "Texture, fullness, and ideal placement",
          content: [
            `${productName} is chosen for soft layered foliage that instantly fills shaded spaces with movement and volume.`,
            "A great fit for balcony corners, patios, covered verandas, and decorative hanging setups.",
            "The plant is sent with compact shaping so it can recover quickly and fan out after settling in.",
          ],
        },
        {
          title: "Care and Placement",
          subtitle: "Moisture, humidity, and trimming tips",
          content: [
            "Ferns prefer steady moisture, so avoid letting the root ball dry out completely.",
            "Keep them out of harsh afternoon sun and mist lightly in drier rooms or windy balconies.",
            "Trim brown fronds from the base to keep the plant looking fresh and balanced.",
          ],
        },
        {
          title: "Delivery and Plant Health",
          subtitle: "Transit care and support promises",
          content: [
            "We secure delicate fronds with breathable wrapping to reduce rubbing during transit.",
            "Place the fern in shade after delivery and water lightly if the soil surface feels dry.",
            "Support is available if you need help restoring volume after shipping.",
          ],
        },
      ],
      reviews: [
        {
          author: "Nabanita Roy",
          location: "Jorhat",
          date: formatReviewDate(seed, 0),
          rating: 5,
          title: "Looks beautiful in a shaded balcony",
          body: `The foliage looks soft and full, and the plant immediately brightened my covered patio. It feels like a proper nursery-grown fern.`,
          tag: "Balcony look",
          helpfulCount: 13,
        },
        {
          author: "Rohit Kalita",
          location: "Guwahati",
          date: formatReviewDate(seed, 1),
          rating: 4,
          title: "Fresh plant with nice volume",
          body: `A few fronds relaxed after transit, but after a day in shade it opened up nicely. Good choice if you want a lush corner plant.`,
          tag: "Packaging",
          helpfulCount: 8,
        },
        {
          author: "Pallabi Deka",
          location: "Tezpur",
          date: formatReviewDate(seed, 2),
          rating: 5,
          title: "Exactly the soft look I wanted",
          body: `Very pretty texture and the nursery support message helped with watering on day one. The plant now looks fuller than when it arrived.`,
          tag: "Plant health",
          helpfulCount: 10,
        },
      ],
    };
  }

  if (product.category === "Lawn Grass") {
    return {
      highlights: [
        { label: "Coverage", value: product.packLabel.replace("Pack of ", "") },
        { label: "Sun need", value: "4 to 6 hours daily" },
        { label: "Foot traffic", value: "Family-use friendly" },
        { label: "Best use", value: "Garden lawns and borders" },
      ],
      accordions: [
        {
          title: "Product Description",
          subtitle: "Coverage, finish, and project suitability",
          content: [
            `${productName} is prepared for clean lawn coverage with a fresh, natural finish suited to homes, pathways, and open green patches.`,
            "Works well for new lawns, patch repairs, and softening hardscape-heavy outdoor spaces.",
            "A solid pick when you want dependable color and a surface that settles evenly over time.",
          ],
        },
        {
          title: "Installation and Care",
          subtitle: "Watering, first-week care, and mowing",
          content: [
            "Lay on leveled soil and water thoroughly right after installation so the roots can knit into the base.",
            "For the first week, keep the grass consistently moist and avoid heavy movement on fresh sections.",
            "Begin mowing only after the lawn is established and the blades are standing upright evenly.",
          ],
        },
        {
          title: "Delivery and Replacement",
          subtitle: "Fresh-cut dispatch and service guidance",
          content: [
            "Grass is dispatched as fresh stock for faster laying and better settling.",
            "Plan delivery close to installation time for the best finish and reduced handling stress.",
            "If you are ordering for a larger site, our team can guide staging and watering priorities.",
          ],
        },
      ],
      reviews: [
        {
          author: "Sourav Nath",
          location: "Guwahati",
          date: formatReviewDate(seed, 0),
          rating: 5,
          title: "Good color and easy to lay",
          body: `${productName} came in usable condition and covered the area cleanly. After watering for a few days, the lawn already looked much more even.`,
          tag: "Lawn finish",
          helpfulCount: 17,
        },
        {
          author: "Rahul Das",
          location: "Nagaon",
          date: formatReviewDate(seed, 1),
          rating: 4,
          title: "Worked well for patch repair",
          body: `I used it to fix a worn family lawn and the color blended in nicely. Worth it if you prepare the base properly before laying.`,
          tag: "Installation",
          helpfulCount: 12,
        },
        {
          author: "Dipika Saikia",
          location: "Dibrugarh",
          date: formatReviewDate(seed, 2),
          rating: 5,
          title: "Fresh cut and healthy texture",
          body: `The grass felt fresh on delivery and not dry. It gave our small front yard a much neater premium look within days.`,
          tag: "Fresh stock",
          helpfulCount: 15,
        },
      ],
    };
  }

  return {
    highlights: [
      { label: "Sun need", value: "Bright outdoor sun" },
      { label: "Watering", value: "Moderate watering" },
      { label: "Display use", value: "Gate, terrace, or border" },
      { label: "Plant style", value: product.badge },
    ],
    accordions: [
      {
        title: "Product Description",
        subtitle: "Bloom style, color impact, and placement",
        content: [
          `${productName} is selected for visible color impact and reliable garden presence in outdoor settings.`,
          "Useful for entrance framing, sunny terraces, boundary planting, and decorative feature pots.",
          "The plant is packed to retain shape and reduce branch movement during delivery.",
        ],
      },
      {
        title: "Care and Placement",
        subtitle: "Sunlight, watering, and pruning support",
        content: [
          "Place where the plant can receive strong daylight and enough air movement.",
          "Water deeply when the topsoil begins to dry and reduce overwatering in humid spells.",
          "Light pruning after a bloom cycle helps encourage cleaner growth and future branching.",
        ],
      },
      {
        title: "Delivery and Plant Health",
        subtitle: "Dispatch expectations and aftercare",
        content: [
          "Branches are secured for transit to protect buds and tender growth.",
          "Allow one to two days for the plant to relax after delivery before moving it into full sun.",
          "Our team can suggest watering and trimming adjustments if you need post-delivery support.",
        ],
      },
    ],
    reviews: [
      {
        author: "Priyanka Sen",
        location: "Shillong",
        date: formatReviewDate(seed, 0),
        rating: 5,
        title: "Beautiful color and healthy stems",
        body: `${productName} added instant brightness to my terrace. The plant arrived sturdy and looked like it had been handled carefully.`,
        tag: "Bloom quality",
        helpfulCount: 12,
      },
      {
        author: "Amitava Deb",
        location: "Agartala",
        date: formatReviewDate(seed, 1),
        rating: 4,
        title: "Strong outdoor performer",
        body: `Placed it near the gate and it settled well after the first watering. Nice choice if you want visible color without fuss.`,
        tag: "Garden look",
        helpfulCount: 8,
      },
      {
        author: "Bhaswati Gogoi",
        location: "Tinsukia",
        date: formatReviewDate(seed, 2),
        rating: 5,
        title: "Good nursery finish",
        body: `The plant shape was balanced and the leaves looked clean. It felt much better than random market stock.`,
        tag: "Packaging",
        helpfulCount: 10,
      },
    ],
  };
}

export function getProductExperience(product: Product): ProductExperience {
  const seed = getSeed(product.id);
  const rating = Number((4.2 + (seed % 7) * 0.1).toFixed(1));
  const totalRatings = 96 + (seed % 240);
  const recommendPercent = clamp(86 + (seed % 10), 86, 95);

  const fiveStarCount = Math.round(totalRatings * (0.52 + (seed % 4) * 0.03));
  const fourStarCount = Math.round(totalRatings * (0.24 + (seed % 3) * 0.02));
  const threeStarCount = Math.round(totalRatings * 0.12);
  const twoStarCount = Math.round(totalRatings * 0.07);
  const oneStarCount = Math.max(
    0,
    totalRatings - fiveStarCount - fourStarCount - threeStarCount - twoStarCount,
  );

  const categoryContent = getCategoryContent(product, seed);

  return {
    rating,
    totalRatings,
    recommendPercent,
    ratingBreakdown: [
      { stars: 5, count: fiveStarCount },
      { stars: 4, count: fourStarCount },
      { stars: 3, count: threeStarCount },
      { stars: 2, count: twoStarCount },
      { stars: 1, count: oneStarCount },
    ],
    highlights: categoryContent.highlights,
    accordions: categoryContent.accordions,
    reviews: categoryContent.reviews,
    reviewTags: ["Most Helpful", "Plant Health", "Packaging", "Delivery"],
    nurseryPromises: [
      {
        title: "Nursery Fresh",
        description: "Selected stock with healthy foliage and ready-to-settle roots.",
        icon: BadgeCheck,
      },
      {
        title: "Secure Checkout",
        description: "Protected ordering flow with clear cart and profile support.",
        icon: CreditCard,
      },
      {
        title: "Safe Dispatch",
        description: "Packed to reduce transit stress and keep plants protected.",
        icon: Truck,
      },
      {
        title: "Care Support",
        description: "Follow-up guidance for placement, watering, and recovery.",
        icon: ShieldCheck,
      },
    ],
  };
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(rating);

        return (
          <Star
            key={index}
            size={18}
            className={filled ? "text-[#f1bf4a]" : "text-[#d2ddc2]"}
            fill={filled ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

export default function ProductDetailsSections({ product }: { product: Product }) {
  const experience = getProductExperience(product);
  const highestBreakdownCount = Math.max(...experience.ratingBreakdown.map((item) => item.count), 1);

  return (
    <div className="space-y-10">
      <section className="rounded-[2.2rem] border border-[#d6e6bd] bg-white p-6 shadow-[0_24px_56px_rgba(33,79,20,0.06)] md:p-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6b8b58]">
              Key highlights
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#163915] md:text-4xl">
              Product details for everyday plant care
            </h2>

            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {experience.highlights.map((item) => (
                <div key={item.label} className="border-b border-[#e6eedc] pb-4">
                  <p className="text-sm text-[#7a8f6f]">{item.label}</p>
                  <p className="mt-2 text-xl font-bold text-[#163915]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {experience.accordions.map((item, index) => (
              <details
                key={item.title}
                open={index === 0}
                className="group rounded-[1.6rem] border border-[#d8e6cb] bg-[#f9fcf5] p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-[#163915]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#6d8464]">{item.subtitle}</p>
                  </div>
                  <ChevronDown className="text-[#5d7b56] transition group-open:rotate-180" size={20} />
                </summary>

                <div className="mt-4 space-y-3 border-t border-[#e3edd7] pt-4">
                  {item.content.map((line) => (
                    <p key={line} className="text-sm leading-7 text-[#58724f]">
                      {line}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {experience.nurseryPromises.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="rounded-[1.6rem] border border-[#d9e7cb] bg-[#f4f9ec] p-5"
            >
              <div className="inline-flex rounded-2xl bg-white p-3 text-[#214f14] shadow-sm">
                <Icon size={22} />
              </div>
              <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-[#214f14]">
                {title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5f7857]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2.2rem] border border-[#d6e6bd] bg-[#f7fbf1] p-6 shadow-[0_24px_56px_rgba(33,79,20,0.06)] md:p-8">
        <div className="flex flex-wrap gap-3 rounded-[1.4rem] bg-[#edf3e6] p-2">
          <button
            type="button"
            className="rounded-[1rem] bg-white px-5 py-3 text-sm font-bold text-[#163915] shadow-sm"
          >
            Product Reviews
          </button>
          <button
            type="button"
            className="rounded-[1rem] px-5 py-3 text-sm font-bold text-[#8aa07e]"
          >
            Nursery Service
          </button>
        </div>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#214f14]">
          <ThumbsUp size={16} className="text-[#6fb44c]" />
          {experience.recommendPercent}% of buyers recommend this product
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-[1.8rem] bg-white p-6">
            <p className="text-6xl font-black tracking-[-0.06em] text-[#163915]">
              {experience.rating.toFixed(1)}
            </p>
            <p className="mt-3 text-base text-[#69815f]">{experience.totalRatings} ratings</p>
            <div className="mt-4">
              <RatingStars rating={experience.rating} />
            </div>
            <button
              type="button"
              className="mt-6 rounded-full border border-[#cfe0b5] px-5 py-3 text-sm font-bold text-[#214f14] transition hover:bg-[#f2f8ea]"
            >
              Rate this plant
            </button>
          </div>

          <div className="rounded-[1.8rem] bg-white p-6">
            <div className="space-y-4">
              {experience.ratingBreakdown.map((item) => (
                <div key={item.stars} className="grid grid-cols-[24px_minmax(0,1fr)_52px] items-center gap-4">
                  <span className="text-2xl font-semibold text-[#163915]">{item.stars}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e3e8dc]">
                    <div
                      className={`h-full rounded-full ${
                        item.stars >= 4
                          ? "bg-[#6fb44c]"
                          : item.stars === 3
                            ? "bg-[#e7b85f]"
                            : "bg-[#d8e0d0]"
                      }`}
                      style={{ width: `${(item.count / highestBreakdownCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-right text-base text-[#5f7857]">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[#d9e7cb] bg-[#f6faef] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-[#214f14] shadow-sm">
                  <Sprout size={18} />
                </div>
                <div>
                  <p className="text-base font-bold text-[#163915]">Why buyers like it</p>
                  <p className="mt-2 text-sm leading-6 text-[#5c7752]">
                    Customers mention healthy arrival, easy settling after delivery, and a look that
                    matches the product photos for {product.name.toLowerCase()}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#dfe9d4] pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6b8b58]">
                Customer voices
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#163915]">
                Hear what customers say
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {experience.reviewTags.map((tag, index) => (
                <button
                  key={tag}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    index === 0
                      ? "border-[#efc86f] bg-[#fff4d7] text-[#8c6310]"
                      : "border-[#d4e2c5] bg-white text-[#5f7857]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {experience.reviews.map((review) => (
              <article
                key={`${review.author}-${review.date}`}
                className="rounded-[1.8rem] border border-[#dce8ce] bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <RatingStars rating={review.rating} />
                      <span className="rounded-full bg-[#eef5e3] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#214f14]">
                        {review.tag}
                      </span>
                    </div>
                    <p className="mt-4 text-xl font-bold text-[#163915]">{review.title}</p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-[#f4f8ee] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#53724d]">
                    <Leaf size={14} />
                    Verified buyer
                  </div>
                </div>

                <p className="mt-4 max-w-4xl text-base leading-8 text-[#55714d]">{review.body}</p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4edd9] pt-5 text-sm text-[#6b8463]">
                  <div>
                    <p className="font-bold text-[#163915]">{review.author}</p>
                    <p className="mt-1">
                      {review.location} - {review.date}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-[#f6faef] px-3 py-2 font-semibold text-[#214f14]">
                    <ThumbsUp size={15} />
                    {review.helpfulCount} people found this helpful
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

