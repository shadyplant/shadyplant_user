"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function ProcessSection() {
  return (
    <section className="w-full px-4 py-16 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="theme-panel rounded-[2rem] p-8 md:p-10"
          >
            <p className="theme-chip mb-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              How we work
            </p>
            <h2 className="theme-section-title text-3xl font-semibold md:text-4xl">
              A Reliable and Efficient Process.
            </h2>

            <p className="theme-muted mt-4 text-sm leading-relaxed md:text-base">
              From carefully harvesting fresh grass to safe loading and timely
              delivery, we follow a structured process to ensure top-quality
              results. Every step is handled with care to maintain freshness,
              density, and durability.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="relative h-[260px] w-full overflow-hidden rounded-[2rem] border border-white/40 shadow-[0_24px_60px_rgba(33,79,20,0.12)] md:h-[320px]"
          >
            <Image
              src="https://cdn2.hubspot.net/hubfs/4598250/Photos%20Low%20Rez/Crew/grassperson-crew-lawn-maintenance-leaf-raking-truck-2.jpg"
              alt="grass process"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="relative h-[300px] w-full overflow-hidden rounded-[2rem] border border-white/40 shadow-[0_24px_60px_rgba(33,79,20,0.12)] md:h-[380px]"
          >
            <Image
              src="https://rukminim2.flixcart.com/image/480/640/xif0q/plant-seed/n/s/r/6000-lawngrass-seeds-brs-6000pp-077-sree-original-imagv5fnzmkczbpe.jpeg?q=90"
              alt="loading grass"
              fill
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="theme-panel rounded-[2rem] p-8 md:p-10"
          >
            <p className="theme-chip mb-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              Why choose our grass
            </p>

            <h2 className="theme-section-title text-3xl font-semibold md:text-4xl">
              Premium Quality That Stands Out.
            </h2>

            <p className="theme-muted mt-4 text-sm leading-relaxed md:text-base">
              Our lawn grass is fresh, dense, and long-lasting, perfect for
              residential lawns, commercial spaces, and landscaping projects. We
              ensure consistent quality, competitive pricing, and reliable
              delivery across all Northeast states.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
