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
    title: "1. Our Story",
    content: [
      "ShadyPlant was founded with a simple vision: to help people transform their homes, offices, and outdoor spaces through the beauty of plants.",
      "What started as a passion for gardening has grown into a dedicated online nursery serving plant lovers across India. We understand the joy of receiving a thriving new plant and the excitement of watching it grow over time. That's why every plant we ship is carefully selected, nurtured, and packaged with care.",
      "Our goal is not just to sell plants, but to help create greener, healthier living spaces for our customers.",
    ],
  },
  {
    title: "2. What We Offer",
    content: "We carefully curate a wide range of products to meet the needs of plant enthusiasts and home gardeners.",
    subsections: [
      {
        title: "Indoor Plants",
        content: "Enhance your living spaces with beautiful indoor plants that thrive in homes and offices.",
      },
      {
        title: "Outdoor Plants",
        content: "Discover flowering plants, ornamental varieties, and garden favorites for your outdoor spaces.",
      },
      {
        title: "Air-Purifying Plants",
        content: "Improve indoor air quality with plants known for their natural air-cleaning properties.",
      },
      {
        title: "Pots & Planters",
        content: "Stylish and functional planters to complement every plant and décor style.",
      },
      {
        title: "Gardening Essentials",
        content: "Tools, accessories, soil, fertilizers, and everything you need to support healthy plant growth.",
      },
      {
        title: "Plant Care Resources",
        content: "Helpful guides, tips, and educational content designed to help you succeed in your gardening journey.",
      },
    ],
  },
  {
    title: "3. Our Commitment to Quality",
    content: "Every plant deserves proper care before it reaches your home. That's why we:",
    bullets: [
      "Source healthy and high-quality plants.",
      "Conduct quality checks before shipment.",
      "Use secure packaging methods to protect plants during transit.",
      "Continuously improve our processes to ensure customer satisfaction.",
    ],
    note: "We treat every order with the same care and attention that we would give to plants in our own collection.",
  },
  {
    title: "4. Why Choose ShadyPlant?",
    subsections: [
      {
        title: "Healthy Plants",
        content: "We prioritize plant health and quality at every stage of growth and shipping.",
      },
      {
        title: "Secure Packaging",
        content: "Our packaging is designed to minimize transit stress and ensure safe delivery.",
      },
      {
        title: "Customer Support",
        content: "Our team is here to assist with plant care guidance, order support, and product recommendations.",
      },
      {
        title: "Trusted Shopping Experience",
        content: "We aim to provide a reliable and enjoyable online shopping experience from browsing to delivery.",
      },
      {
        title: "Growing Community",
        content: "We are building a community of plant lovers who share a passion for greener homes and sustainable living.",
      },
    ],
  },
  {
    title: "5. Our Vision",
    content: [
      "To inspire more people to embrace nature, create greener living spaces, and experience the many benefits that plants bring to everyday life.",
      "We envision a future where every home, workspace, and community has a stronger connection to nature.",
    ],
  },
  {
    title: "6. Sustainability Matters",
    content: "We believe in responsible gardening and sustainable practices. As we grow, we continue exploring ways to:",
    bullets: [
      "Reduce packaging waste",
      "Improve eco-friendly shipping practices",
      "Promote plant care education",
      "Encourage greener lifestyles",
    ],
    note: "Small steps toward sustainability can create a lasting impact for future generations.",
  },
  {
    title: "7. Join the ShadyPlant Family",
    content: "Whether you're purchasing your first houseplant or expanding an established collection, we're excited to be part of your plant journey.",
    note: "Thank you for choosing ShadyPlant and helping us create a greener world—one plant at a time. 🌱 Grow with us. Thrive with nature.",
  },
  {
    title: "8. Contact Us",
    content: "We'd love to hear from you and help with any questions you may have.",
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

export default function AboutUsPage() {
  return (
    <SiteShell>
      <div className="bg-white px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Header Section */}
          <div className="border-b border-zinc-200 pb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Our Story
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
              About Us
            </h1>
            <p className="mt-6 text-[18px] font-medium leading-relaxed text-zinc-900">
              Bringing Nature Closer to Every Home 🌿
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-zinc-600">
              Welcome to <strong>ShadyPlant</strong>, your trusted destination for healthy plants, 
              beautiful greenery, and gardening essentials delivered right to your doorstep.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-zinc-600">
              At ShadyPlant, we believe that plants do more than decorate spaces—they create healthier 
              environments, improve well-being, and bring people closer to nature. Our mission is to make 
              plant parenting simple, enjoyable, and accessible for everyone, whether you&apos;re a beginner 
              or an experienced gardener.
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