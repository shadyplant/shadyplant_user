"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Phone,
  Mail,
  MessageCircle,
  Leaf,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const faqs = [
  {
    q: "What type of grass do you supply?",
    a: "We mainly supply premium carpet lawn grass, ideal for residential lawns, commercial spaces, parks, and construction projects. Our grass gives a dense, green, and smooth finish.",
  },
  {
    q: "Do you supply grass in bulk for large projects?",
    a: "Yes, we handle bulk orders for large residential and commercial landscaping projects.",
  },
  {
    q: "Which locations do you serve?",
    a: "We serve all Northeast states including Assam, Meghalaya, Tripura, Nagaland, and more.",
  },
  {
    q: "How is the grass delivered?",
    a: "Grass is delivered in fresh-cut pieces, carefully packed and transported to maintain quality.",
  },
  {
    q: "How much does lawn grass cost?",
    a: "Pricing depends on quantity, location, and delivery requirements. Contact us for an estimate.",
  },
  {
    q: "Do you provide installation services?",
    a: "Yes, we also provide installation support for selected locations.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="blogs" className="w-full px-4 py-16 md:px-6">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <div className="theme-chip mb-4 inline-flex px-6 py-2 text-sm font-medium">
            FAQs
          </div>
          <h2 className="theme-section-title text-3xl font-semibold md:text-4xl">
            We&apos;ve got your answers.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={index} className="theme-panel rounded-[1.5rem] px-5 py-4">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-800">
                    {index + 1}. {item.q}
                  </span>

                  {isOpen ? (
                    <Minus className="text-green-700" size={18} />
                  ) : (
                    <Plus className="text-green-700" size={18} />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="theme-muted mt-2 pr-6 text-sm">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mb-8 mt-8 flex justify-center gap-4">
          <div className="theme-panel flex h-10 w-10 items-center justify-center rounded-full">
            <Phone size={18} className="text-blue-500" />
          </div>
          <div className="theme-panel flex h-10 w-10 items-center justify-center rounded-full">
            <Mail size={18} className="text-yellow-500" />
          </div>
          <div className="theme-panel flex h-10 w-10 items-center justify-center rounded-full">
            <MessageCircle size={18} className="text-green-600" />
          </div>
        </div>

        <GrassBanner />
      </div>
    </section>
  );
}

function GrassBanner() {
  const highlights = [
    { label: "Fresh-cut supply", icon: Leaf },
    { label: "Trusted project delivery", icon: ShieldCheck },
    { label: "Fast quote turnaround", icon: Sparkles },
  ];

  return (
    <section className="relative mt-14 overflow-hidden rounded-[2rem] border border-[#cfe6bf] bg-[linear-gradient(135deg,#163c10_0%,#2a6b1f_45%,#d9f3a7_100%)] px-6 py-8 md:px-10 md:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(236,255,217,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.28),transparent_26%)]" />
      <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-[#dff8b8]/25 blur-3xl" />
      <div className="absolute right-6 top-6 h-20 w-20 rounded-full border border-white/20 bg-white/10" />
      <div className="absolute bottom-8 right-12 h-24 w-24 rounded-full border border-[#efffd8]/20 bg-[#efffd8]/10" />

      <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.85fr] lg:items-end">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#efffd8] backdrop-blur-sm"
          >
            <Leaf size={16} />
            Lawn Supply Partner
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="mt-5"
          >
            <p className="text-sm font-medium uppercase tracking-[0.42em] text-[#e8ffcb]/80">
              Northeast India
            </p>
            <h3 className="mt-3 text-4xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white md:text-6xl">
              Grass Green
              <span className="block text-[#daf57d]">Nursery</span>
            </h3>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#edf9e0] md:text-base">
              Premium carpet grass, site-ready deliveries, and dependable
              support for homes, builders, and large landscaping projects.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, delay: 0.12 }}
          className="rounded-[1.75rem] border border-white/18 bg-[#f8ffe9]/10 p-4 backdrop-blur-md md:p-5"
        >
          <div className="grid gap-3">
            {highlights.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-[#f7fff0]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e0f8b4] text-[#214f14]">
                  <Icon size={18} />
                </div>
                <span className="text-sm font-semibold md:text-base">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-end justify-between gap-4 rounded-2xl bg-[#0f2b0b]/30 px-4 py-4 text-white">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#d9f1bd]">
                Since 2018
              </p>
              <p className="mt-1 text-lg font-bold">Ready for your next site</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-[#daf57d]">5+</p>
              <p className="text-xs uppercase tracking-[0.22em] text-[#edf9e0]/75">
                States served
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
