"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import FAQIcon from "@/assets/home_section_icons/faq";

const faqs = [
  {
    q: "What types of plants and grass do you offer?",
    a: "We offer carpet lawn grass, indoor plants, outdoor plants, ferns, decorative greens, and seasonal nursery selections for homes, offices, and landscaping projects.",
  },
  {
    q: "Do you deliver across Guwahati and nearby areas?",
    a: "Yes. Delivery availability depends on your selected location and order size. Delivery charges are calculated during checkout based on distance and product weight.",
  },
  {
    q: "Can I place bulk orders for landscaping or site work?",
    a: "Yes. We support bulk lawn grass and plant orders for residential projects, commercial landscaping, and larger site requirements.",
  },
  {
    q: "How do I know whether a product is in stock?",
    a: "Live stock is shown on the product pages. If an item is unavailable, you may see an out-of-stock state or a stock alert option where available.",
  },
  {
    q: "Can I choose cash on delivery or online payment?",
    a: "Yes. Eligible orders can be placed with cash on delivery or online payment, depending on the checkout options available for your order and area.",
  },
  {
    q: "When will I receive my order?",
    a: "Estimated delivery timing depends on product type, delivery location, and checkout selection. You will see the preferred delivery flow during checkout.",
  },
  {
    q: "Can I update my delivery address before checkout?",
    a: "Yes. You can update your address from the cart, checkout flow, or profile before placing the order. Delivery charges may change based on the new location.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="px-3 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center md:h-7 md:w-7">
              <FAQIcon
                className="h-auto max-h-full w-auto max-w-full"
                aria-hidden="true"
              />
            </div>
            <span className="text-[1.45rem] text-[#163915] md:text-3xl">
              Frequently asked questions
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div className="overflow-hidden rounded-[1.8rem] bg-[#f3f5ee]">
            <div className="relative aspect-[4/4.35] min-h-[280px] w-full md:min-h-[420px]">
              <Image
                src="/hero_image.png"
                alt="Plants arranged indoors"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority={false}
              />
            </div>
          </div>

          <div className="">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={item.q}
                  className="overflow-hidden border-b border-[#d7ddd2]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-7"
                  >
                    <span className="text-sm leading-6 text-[#1b2517] md:text-[15px] lg:text-[17px]">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <Minus
                        size={18}
                        className="shrink-0 text-[#1b2517]"
                      />
                    ) : (
                      <Plus
                        size={18}
                        className="shrink-0 text-[#1b2517]"
                      />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[#d7ddd2] px-5 py-4 md:px-7">
                          <p className="text-sm leading-6 text-[#4e5d4b] md:text-[15px]">
                            {item.a}
                          </p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
