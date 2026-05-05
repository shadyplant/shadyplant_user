import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Leaf,
  ShieldCheck,
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

export type ProductExperience = {
  highlights: ProductHighlight[];
  accordions: ProductAccordion[];
  nurseryPromises: Array<{
    title: string;
    description: string;
    icon: typeof Leaf;
  }>;
};

function getCategoryContent(product: Product) {
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
  };
}

export function getProductExperience(product: Product): ProductExperience {
  const categoryContent = getCategoryContent(product);

  return {
    highlights: categoryContent.highlights,
    accordions: categoryContent.accordions,
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

export default function ProductDetailsSections({ product }: { product: Product }) {
  const experience = getProductExperience(product);

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
            {experience.accordions.map((item) => (
              <details
                key={item.title}
                className="group rounded-[1.6rem] border border-[#d8e6cb] bg-[#f9fcf5] p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-[#163915]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#6d8464]">{item.subtitle}</p>
                  </div>
                  <ChevronDown
                    className="text-[#5d7b56] transition group-open:rotate-180"
                    size={20}
                  />
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
    </div>
  );
}
