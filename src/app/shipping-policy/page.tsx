import SiteFooter from "@/components/SiteFooter";
import SiteShell from "@/components/SiteShell";
import Link from "next/link";
import type { ReactNode } from "react";

type PolicySection = {
  title: string;
  content?: ReactNode;
  bullets?: ReactNode[];
  note?: ReactNode;
  subsections?: Array<{
    title: string;
    content?: ReactNode;
    bullets?: ReactNode[];
  }>;
  contact?: boolean;
};

const sections: PolicySection[] = [
  {
    title: "1. Overview",
    content: [
      "This Shipping Policy explains the shipping methods, delivery timelines, charges, and responsibilities associated with orders placed through ShadyPlant.",
      "By placing an order on our website, you agree to the terms outlined below.",
    ],
  },
  {
    title: "2. Order Processing",
    content: "All orders are processed after payment confirmation.",
    subsections: [
      {
        title: "Processing Time",
        content: "Orders are typically processed within 1–3 business days. Orders placed on weekends or public holidays will be processed on the next business day.",
      },
    ],
    note: "During peak seasons, promotional events, or holidays, processing times may be extended. Once your order has been shipped, you will receive a shipping confirmation email containing tracking information, where available.",
  },
  {
    title: "3. Delivery Locations",
    content: "We currently ship to most serviceable locations across India. However, delivery availability may vary depending on:",
    bullets: [
      "Courier partner coverage",
      "Weather conditions",
      "Remote or restricted service areas",
      "Government regulations or local restrictions",
    ],
    note: "If we are unable to deliver to your location, we will notify you and issue a refund if applicable.",
  },
  {
    title: "4. Estimated Delivery Time",
    content: "Delivery timelines may vary depending on your location and courier partner availability.",
    subsections: [
      {
        title: "Standard Delivery",
        content: "Metro Cities: 2–5 business days | Tier 2 & Tier 3 Cities: 3–7 business days | Remote Areas: 5–10 business days",
      },
    ],
    note: "Please note that delivery estimates are approximate and are not guaranteed.",
  },
  {
    title: "5. Shipping Charges",
    content: "Shipping charges are calculated based on order value, product weight and dimensions, and the delivery location.",
    note: "Applicable shipping charges will be displayed during checkout before payment is completed. From time to time, ShadyPlant may offer free shipping promotions on eligible products or orders.",
  },
  {
    title: "6. Live Plant Shipping",
    content: "Live plants require special handling during transit. To ensure plants arrive in healthy condition, plants are carefully inspected before shipment and securely packaged to minimize transit stress.",
    note: "Minor leaf shedding, soil displacement, or slight variations in appearance may occur during shipping and are considered normal. We recommend unpacking plants immediately upon delivery and providing appropriate care according to the plant's requirements.",
  },
  {
    title: "7. Tracking Your Order",
    content: "Once your order is shipped, you will receive a shipment confirmation email with a tracking number and a tracking link where available.",
    note: "Customers are responsible for monitoring shipment status and ensuring someone is available to receive the package.",
  },
  {
    title: "8. Delayed Deliveries",
    content: "While we strive to meet estimated delivery timelines, delays may occur due to extreme weather conditions, natural disasters, transportation disruptions, courier partner delays, public holidays, or government restrictions.",
    note: "ShadyPlant is not liable for delays caused by circumstances beyond our reasonable control.",
  },
  {
    title: "9. Incorrect Shipping Information",
    content: "Customers are responsible for providing accurate shipping details, including the correct recipient name, complete address, and a valid phone number.",
    note: "If an order is returned due to an incorrect or incomplete address, additional shipping charges may apply for reshipment and original shipping charges remain non-refundable.",
  },
  {
    title: "10. Damaged & Lost Packages",
    subsections: [
      {
        title: "Damaged Packages",
        content: "If your package arrives visibly damaged, take clear photographs of the package and products, and contact us within 48 hours of delivery with your order number and supporting images.",
      },
      {
        title: "Lost Shipments",
        content: "If your tracking indicates delivery but you have not received your package, contact the courier service first. If the issue remains unresolved, contact our support team within 5 days of the reported delivery date.",
      },
    ],
  },
  {
    title: "11. Order Cancellation",
    content: "Orders may be cancelled before they are shipped. Once an order has been dispatched, cancellation requests cannot be guaranteed and will be subject to our Return & Refund Policy.",
  },
  {
    title: "12. Force Majeure",
    content: "ShadyPlant shall not be held responsible for shipping delays or failures caused by events beyond our control, including natural disasters, floods, earthquakes, pandemics, strikes, government actions, or transportation interruptions.",
  },
  {
    title: "13. Contact Us",
    content: "If you have any questions regarding shipping, delivery, tracking, or order status, please contact us:",
    contact: true,
  },
];

function PolicyList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-3 pl-5 text-[15px] leading-relaxed text-zinc-600">
      {items.map((item, index) => (
        <li key={index} className="list-disc markers:text-zinc-400">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ShippingPolicyPage() {
  return (
    <SiteShell>
      <div className="bg-white px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Header Section */}
          <div className="border-b border-zinc-200 pb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Fulfillment
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
              Shipping Policy
            </h1>
            <p className="mt-4 text-[15px] text-zinc-500">
              Last Updated: June 18, 2026
            </p>
            <p className="mt-6 text-[16px] leading-relaxed text-zinc-600">
              At <strong>ShadyPlant</strong>, we are committed to delivering healthy plants and 
              quality gardening products safely and efficiently to your doorstep. Please review 
              our shipping policy to understand how orders are processed, shipped, and delivered.
            </p>
          </div>

          {/* Main Content Sections */}
          <div className="space-y-12 pt-10">
            {sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                  {section.title}
                </h2>

                {section.content ? (
                  <div className="text-[15px] leading-relaxed text-zinc-600 space-y-3">
                    {Array.isArray(section.content) ? (
                      section.content.map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))
                    ) : (
                      <p>{section.content}</p>
                    )}
                  </div>
                ) : null}

                {section.bullets ? (
                  <PolicyList items={section.bullets} />
                ) : null}

                {section.subsections ? (
                  <div className="mt-6 space-y-6 border-l-2 border-zinc-100 pl-4">
                    {section.subsections.map((subsection) => (
                      <div key={subsection.title} className="space-y-2">
                        <h3 className="text-[16px] font-medium text-zinc-900">
                          {subsection.title}
                        </h3>
                        {subsection.content ? (
                          <p className="text-[15px] leading-relaxed text-zinc-600">
                            {subsection.content}
                          </p>
                        ) : null}
                        {subsection.bullets ? (
                          <PolicyList items={subsection.bullets} />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.note ? (
                  <div className="rounded-xl bg-zinc-50 p-4 text-[14px] leading-relaxed text-zinc-500">
                    {section.note}
                  </div>
                ) : null}

                {section.contact ? (
                  <div className="rounded-xl border border-zinc-200 p-5 text-[15px] leading-relaxed text-zinc-600">
                    <p className="font-semibold text-zinc-900">ShadyPlant</p>
                    <p className="mt-2">
                      Website:{" "}
                      <a
                        href="https://www.shadyplant.in"
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-900 underline underline-offset-4 transition hover:text-zinc-500"
                      >
                        www.shadyplant.in
                      </a>
                    </p>
                    <p>
                      Email:{" "}
                      <a
                        href="mailto:support@shadyplant.in"
                        className="text-zinc-900 underline underline-offset-4 transition hover:text-zinc-500"
                      >
                        support@shadyplant.in
                      </a>
                    </p>
                  </div>
                ) : null}
              </section>
            ))}

          </div>
        </div>
      </div>

      <SiteFooter />
    </SiteShell>
  );
}