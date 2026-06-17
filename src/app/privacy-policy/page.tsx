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
    title: "1. Who We Are",
    content: [
      "ShadyPlant is an online plant nursery and gardening store that provides plants, planters, gardening supplies, and related services to customers across India.",
      "If you have any questions regarding this Privacy Policy, please contact us at:",
    ],
    bullets: [
      <span key="email">
        <strong>Email:</strong>{" "}
        <a
          href="mailto:support@shadyplant.in"
          className="text-zinc-900 underline underline-offset-4 transition hover:text-zinc-500"
        >
          support@shadyplant.in
        </a>
      </span>,
      <span key="website">
        <strong>Website:</strong>{" "}
        <a
          href="https://www.shadyplant.in"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-900 underline underline-offset-4 transition hover:text-zinc-500"
        >
          ShadyPlant
        </a>
      </span>,
    ],
  },
  {
    title: "2. Information We Collect",
    subsections: [
      {
        title: "Personal Information",
        content:
          "When you create an account, place an order, subscribe to our newsletter, or contact us, we may collect:",
        bullets: [
          "Full name",
          "Email address",
          "Phone number",
          "Shipping address",
          "Billing address",
          "Order history",
          "Account credentials",
          "Customer support communications",
        ],
      },
      {
        title: "Payment Information",
        content:
          "Payments are processed through secure third-party payment providers. We do not store your complete debit card, credit card, UPI PIN, or banking credentials on our servers.",
      },
      {
        title: "Automatically Collected Information",
        content:
          "When you browse our website, we may automatically collect:",
        bullets: [
          "IP address",
          "Browser type",
          "Device information",
          "Operating system",
          "Pages visited",
          "Referral source",
          "Website usage data",
          "Cookies and similar technologies",
        ],
      },
    ],
  },
  {
    title: "3. How We Use Your Information",
    bullets: [
      "Process and fulfill orders",
      "Deliver products and services",
      "Manage customer accounts",
      "Provide customer support",
      "Send order confirmations and shipping updates",
      "Improve our website and user experience",
      "Detect fraud and unauthorized activities",
      "Comply with legal obligations",
      "Send promotional emails and offers (with your consent where required)",
    ],
  },
  {
    title: "4. Marketing Communications",
    content:
      "If you subscribe to our newsletter or promotional campaigns, we may send:",
    bullets: [
      "Plant care tips",
      "Gardening guides",
      "Product launches",
      "Seasonal offers",
      "Discount codes",
      "Special promotions",
    ],
    note: "You may unsubscribe at any time using the unsubscribe link included in our emails.",
  },
  {
    title: "5. Cookies and Tracking Technologies",
    content:
      "We use cookies and similar technologies to:",
    bullets: [
      "Remember user preferences",
      "Keep users logged in",
      "Analyze website traffic",
      "Improve website performance",
      "Personalize content and recommendations",
    ],
    note: "You can manage cookie settings through your browser preferences.",
  },
  {
    title: "6. How We Share Information",
    content: "We do not sell your personal information.",
    subsections: [
      {
        title: "Delivery Partners",
        content: "To ship and deliver your orders.",
      },
      {
        title: "Payment Providers",
        content: "To securely process payments.",
      },
      {
        title: "Analytics Providers",
        content: "To understand website usage and improve performance.",
      },
      {
        title: "Marketing Platforms",
        content:
          "To manage newsletters and promotional communications.",
      },
      {
        title: "Legal Authorities",
        content:
          "When required by law, court order, or governmental request.",
      },
    ],
  },
  {
    title: "7. Data Security",
    content:
      "We implement reasonable technical and organizational safeguards to protect your information against:",
    bullets: [
      "Unauthorized access",
      "Data loss",
      "Misuse",
      "Alteration",
      "Disclosure",
    ],
    note: "While we strive to protect your information, no internet transmission or storage method can be guaranteed to be 100% secure.",
  },
  {
    title: "8. Data Retention",
    content:
      "We retain personal information only for as long as necessary to:",
    bullets: [
      "Provide services",
      "Complete transactions",
      "Resolve disputes",
      "Meet legal and regulatory obligations",
      "Enforce our agreements",
    ],
    note: "When information is no longer required, it is securely deleted or anonymized.",
  },
  {
    title: "9. Your Rights",
    content:
      "Depending on applicable laws, you may have the right to:",
    bullets: [
      "Access your personal information",
      "Correct inaccurate information",
      "Request deletion of your information",
      "Withdraw marketing consent",
      "Request a copy of your stored data",
      "Object to certain processing activities",
    ],
    note: (
      <span>
        To exercise these rights, contact us at{" "}
        <a
          href="mailto:support@shadyplant.in"
          className="text-zinc-900 underline underline-offset-4 transition hover:text-zinc-500"
        >
          support@shadyplant.in
        </a>
        .
      </span>
    ),
  },
  {
    title: "10. Children's Privacy",
    content:
      "Our services are not directed toward children under the age of 13.",
    note: "We do not knowingly collect personal information from children. If we become aware that such information has been collected, we will take reasonable steps to remove it.",
  },
  {
    title: "11. Third-Party Services",
    content:
      "Our website may contain links to third-party websites or services.",
    note: "We are not responsible for the privacy practices, content, or security of external websites. We encourage users to review the privacy policies of any third-party sites they visit.",
  },
  {
    title: "12. International Data Transfers",
    content:
      "Some of our service providers may process information outside India. By using our services, you consent to such transfers where necessary, subject to appropriate security measures.",
  },
  {
    title: "13. Changes to This Privacy Policy",
    content:
      "We may update this Privacy Policy from time to time.",
    note: (
      <span>
        Any changes will be posted on this page along with an updated{" "}
        <strong>&quot;Last Updated&quot;</strong> date. Continued use of our
        services after changes become effective constitutes acceptance of the
        revise policy.
      </span>
    ),
  },
  {
    title: "14. Contact Us",
    content:
      "If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:",
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

export default function PrivacyPolicyPage() {
  return (
    <SiteShell>
      <div className="bg-white px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Header Section */}
          <div className="border-b border-zinc-200 pb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Legal
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-[15px] text-zinc-500">
              Last Updated: June 18, 2026
            </p>
            <p className="mt-6 text-[16px] leading-relaxed text-zinc-600">
              Welcome to <strong>ShadyPlant</strong>. Your privacy is important to us. 
              This Privacy Policy explains how we collect, use, store, and protect your 
              information when you visit or make a purchase through{" "}
              <a
                href="https://www.shadyplant.in"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-900 underline underline-offset-4 transition hover:text-zinc-500"
              >
                ShadyPlant
              </a>
              .
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-zinc-600">
              By using our website, you agree to the practices described in this Privacy Policy.
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
                        support@shadyplant.com
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