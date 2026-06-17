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
      "This Return & Refund Policy outlines the conditions under which returns, replacements, exchanges, and refunds may be requested for purchases made through ShadyPlant.",
      "By placing an order with ShadyPlant, you agree to the terms outlined below.",
    ],
  },
  {
    title: "2. Eligibility for Returns",
    content: "To be eligible for a return, the following conditions must be met:",
    bullets: [
      "The item must be unused and in the same condition in which it was received.",
      "The item must be returned in its original packaging.",
      "A return request must be submitted within 5 days of receiving the order.",
    ],
    note: "You may request a return, replacement, or refund if the plant arrived damaged, diseased, or dead; you received an incorrect item; or a non-plant product is unused and in its original packaging.",
  },
  {
    title: "3. Important for Live Plants",
    content:
      "Due to the perishable nature of live plants, customers must provide clear photographs showing the issue within 48 hours of delivery.",
    note: "Claims submitted after 48 hours may not be eligible for replacement or refund.",
  },
  {
    title: "4. Return Process",
    subsections: [
      {
        title: "Step 1: Contact Us",
        content: "Email our support team at support@shadyplant.in within 5 days of receiving your order. Please include your order number, customer name, a description of the issue, and clear photographs.",
      },
      {
        title: "Step 2: Return Authorization",
        content: "If your request is approved, we will provide return instructions and a return authorization confirmation.",
      },
      {
        title: "Step 3: Ship the Item",
        content: "Return items must be shipped within 5 days of authorization. Customers are responsible for return shipping costs unless the item arrived damaged, defective, or was shipped incorrectly.",
      },
    ],
  },
  {
    title: "5. Refunds",
    content:
      "Once we receive and inspect the returned item, we will notify you of the approval or rejection of your refund request.",
    subsections: [
      {
        title: "Live Plants",
        content: "Depending on availability and the nature of the issue, we may offer a replacement plant, store credit, or a partial or full refund (at our discretion).",
      },
      {
        title: "Non-Plant Products",
        content: "Approved refunds will be issued to the original payment method. Refund processing typically takes 5–10 business days after approval.",
      },
    ],
    note: "Please note that your bank, card issuer, or payment provider may require additional processing time before the refund appears in your account.",
  },
  {
    title: "6. Shipping Charges",
    content: "Shipping fees are generally non-refundable. Shipping charges will only be refunded when:",
    bullets: [
      "The item arrived damaged",
      "The item was defective",
      "The wrong product was shipped by ShadyPlant",
    ],
  },
  {
    title: "7. Exchanges",
    content:
      "We replace items only if they are damaged, defective, or incorrect. To request an exchange, contact us within 48 hours of delivery and provide supporting photographs.",
    note: "Exchanges are subject to product availability. If the same item is unavailable, we may offer a replacement of equal value, store credit, or a refund.",
  },
  {
    title: "8. Non-Returnable Items",
    content: "The following items are not eligible for return or refund:",
    bullets: [
      "Live plants removed from their original pots, soil, or packaging",
      "Products returned more than 5 days after delivery",
      "Sale, clearance, or promotional items",
      "Customized or special-order products",
      "Gift cards",
      "Items damaged due to improper care after delivery",
    ],
  },
  {
    title: "9. Gifts",
    subsections: [
      {
        title: "Gift Orders",
        content: "If an item was purchased as a gift and shipped directly to you, approved returns will be issued as store credit or gift credit. Gift credit will be sent electronically once the return is approved.",
      },
      {
        title: "Non-Gift Orders",
        content: "If the item was not marked as a gift at the time of purchase, refunds will be issued directly to the original purchaser.",
      },
    ],
  },
  {
    title: "10. Incorrect Shipping Address",
    content:
      "Customers are responsible for providing accurate shipping information. If an order is returned because of an incorrect or incomplete shipping address, original shipping charges are non-refundable and additional shipping fees may apply for reshipment.",
  },
  {
    title: "11. Cancellation Policy",
    content:
      "Orders may be cancelled before shipment. Once an order has been shipped, cancellation requests cannot be accepted and the order will fall entirely under this Return & Refund Policy.",
  },
  {
    title: "12. Contact Us",
    content:
      "If you have questions, concerns, or requests regarding returns, refunds, exchanges, or damaged deliveries, please contact us:",
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

export default function ReturnRefundPolicyPage() {
  return (
    <SiteShell>
      <div className="bg-white px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Header Section */}
          <div className="border-b border-zinc-200 pb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Customer Service
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
              Return & Refund Policy
            </h1>
            <p className="mt-4 text-[15px] text-zinc-500">
              Last Updated: June 18, 2026
            </p>
            <p className="mt-6 text-[16px] leading-relaxed text-zinc-600">
              At <strong>ShadyPlant</strong>, customer satisfaction is our priority. We take great 
              care in packaging and shipping our plants and products. However, if you experience 
              any issues with your order, we&apos;re here to help.
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