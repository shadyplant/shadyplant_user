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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="home-faq-section px-2 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="w-full mb-4 flex items-center justify-center md:mb-6">
          <span className="text-base text-gray-800 md:text-2xl">
            Frequently Asked Questions ?
          </span>
        </div>

        <div className="rounded-lg bg-white">
          <div className="">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={item.q}
                  className="overflow-hidden border-b border-gray-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-7"
                  >
                    <span className="text-xs text-black/60 md:text-[15px] lg:text-[17px]">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <Minus size={18} className="shrink-0 text-gray-800" />
                    ) : (
                      <Plus size={18} className="shrink-0 text-gray-800" />
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
                        <div className="border-t border-gray-200 px-5 py-4 md:px-7">
                          <p className="text-xs text-black/80 md:text-[15px]">
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
