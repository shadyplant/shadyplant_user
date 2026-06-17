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
    title: "1. About ShadyPlant",
    content: "ShadyPlant is an online nursery and gardening store offering plants, planters, seeds, gardening supplies, and related products through our website (https://www.shadyplant.in).",
  },
  {
    title: "2. Acceptance of Terms",
    content: "By accessing our website, creating an account, placing an order, or using any services provided by ShadyPlant, you confirm that:",
    bullets: [
      "You are at least 18 years old or using the website under parental supervision.",
      "You have the legal authority to enter into these Terms.",
      "You agree to comply with all applicable laws and regulations.",
    ],
    note: "If you do not agree with any part of these Terms, please do not use our services.",
  },
  {
    title: "3. Account Registration",
    content: "You may be required to create an account to access certain features. You agree to provide accurate information, maintain credential confidentiality, and notify us of unauthorized access.",
    note: "ShadyPlant reserves the right to suspend or terminate accounts that contain false information or violate these Terms.",
  },
  {
    title: "4. Products and Availability",
    content: "We strive to accurately display all products, descriptions, images, and pricing. However:",
    bullets: [
      "Plant size, color, shape, and appearance may vary naturally.",
      "Product images are for illustrative purposes only.",
      "Availability is subject to stock levels.",
    ],
    note: "We reserve the right to discontinue products at any time without notice.",
  },
  {
    title: "5. Pricing and Payments",
    content: "All prices are displayed in Indian Rupees (INR) unless otherwise stated. We reserve the right to correct pricing errors, modify prices without notice, and refuse or cancel orders affected by pricing inaccuracies.",
  },
  {
    title: "6. Order Acceptance",
    content: "Receipt of an order confirmation does not guarantee acceptance of the order. ShadyPlant reserves the right to reject any order, limit quantities, cancel suspicious or fraudulent transactions, or refuse service.",
    note: "If payment has already been collected for a cancelled order, an appropriate refund will be issued.",
  },
  {
    title: "7. Shipping, Returns, and Policies",
    content: "Fulfillment, shipping, and return rules are strictly handled by their respective structural policies.",
    bullets: [
      "Shipping and deliveries are exclusively governed by our Shipping Policy.",
      "Returns, refunds, exchanges, and replacements are governed by our Return & Refund Policy.",
      "User information gathering is handled explicitly through our Privacy Policy.",
    ],
  },
  {
    title: "8. Plant Care Responsibility",
    content: "Live plants are natural products and require proper care after delivery. ShadyPlant cannot guarantee plant health if damage results from improper watering, lack of sunlight, environmental conditions, neglect, repotting errors, or post-delivery pest infestations.",
  },
  {
    title: "9. Intellectual Property",
    content: "All content on this website—including logos, branding, images, product descriptions, graphics, text, and design layout—is owned by or licensed to ShadyPlant and protected under applicable intellectual property laws. You may not reproduce, distribute, or exploit any content without written permission.",
  },
  {
    title: "10. Prohibited Activities",
    content: "Users may not use the website for unlawful purposes, attempt unauthorized system access, distribute malware, scrape or harvest content, interfere with website performance, or submit false information.",
    note: "Violation of these Terms may result in immediate account suspension, legal action, or both.",
  },
  {
    title: "11. Limitation of Liability & Disclaimers",
    subsections: [
      {
        title: "Limitation of Liability",
        content: "To the fullest extent permitted by law, ShadyPlant shall not be liable for indirect or consequential damages, loss of profits, delayed deliveries, or temporary interruptions. Our maximum liability shall not exceed the amount paid for the affected order.",
      },
      {
        title: "Disclaimer of Warranties",
        content: "The website, products, and services are provided on an 'as-is' and 'as-available' basis. ShadyPlant makes no guarantees regarding continuous availability, error-free operation, or specific plant growth outcomes under individual environmental conditions.",
      },
    ],
  },
  {
    title: "12. Force Majeure & Termination",
    content: "ShadyPlant shall not be held responsible for delays or failures caused by events beyond our reasonable control, including natural disasters, floods, pandemics, government actions, strikes, transportation disruptions, or internet outages. We reserve the right to suspend access at any time for layout violations or business needs.",
  },
  {
    title: "13. Governing Law & Changes",
    content: "These Terms shall be governed and interpreted in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts corresponding to ShadyPlant's principal place of business. Updates will be posted with an updated 'Last Updated' date.",
  },
  {
    title: "14. Contact Us",
    content: "For questions, structural issues, or regulatory inquiries regarding these Terms of Service, please contact us:",
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

export default function TermsOfServicePage() {
  return (
    <SiteShell>
      <div className="bg-white px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Header Section */}
          <div className="border-b border-zinc-200 pb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Legal Framework
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-[15px] text-zinc-500">
              Last Updated: June 18, 2026
            </p>
            <p className="mt-6 text-[16px] leading-relaxed text-zinc-600">
              Welcome to <strong>ShadyPlant</strong>. These Terms of Service (&quot;Terms&quot;) 
              govern your access to and use of the ShadyPlant website, products, and services. 
              By accessing or using our website, you agree to be bound by these Terms.
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