"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf, Star, Clock, Package } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="w-full px-4 py-16 md:px-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 flex justify-center">
          <div className="theme-chip px-6 py-2 text-sm font-medium">
            About Us
          </div>
        </div>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="relative h-[300px] w-full overflow-hidden rounded-[2rem] border border-white/40 shadow-[0_24px_60px_rgba(33,79,20,0.12)] md:h-[380px]"
          >
            <Image
              src="https://stevesservicesllc.com/wp-content/uploads/2025/10/how-much-is-sod-per-sq-ft-image.jpg"
              alt="nursery"
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
            <h2 className="theme-section-title mb-4 text-3xl font-semibold leading-snug md:text-4xl">
              Your Trusted Nursery and Lawn Grass Supplier.
            </h2>

            <p className="theme-muted mb-4">
              Since 2018, we have been supplying premium quality carpet lawn
              grass across Northeast India. Our focus is on delivering fresh,
              dense, and long-lasting grass suitable for all types of
              landscaping needs.
            </p>

            <p className="theme-muted">
              From small residential lawns to large commercial and construction
              projects, we ensure quality, consistency, and timely delivery
              every time.
            </p>
          </motion.div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="theme-panel flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-green-900"
          >
            <Leaf size={18} />
            6+ Years of Experience
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="theme-button flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium"
          >
            <Package size={18} />
            Serving All Northeast States
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="theme-button flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium"
          >
            <Star size={18} />
            Trusted Lawn Grass Supplier
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="theme-panel flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-green-900"
          >
            <Clock size={18} />
            On-Time Delivery Support
          </motion.div>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-gray-600">
          <div className="theme-panel flex h-10 w-10 items-center justify-center rounded-full">
            <Image
              src="https://img.icons8.com/?size=100&id=Xy10Jcu1L2Su&format=png&color=000000"
              alt=""
              width={24}
              height={24}
            />
          </div>
          <div className="theme-panel flex h-10 w-10 items-center justify-center rounded-full">
            <Image
              src="https://img.icons8.com/?size=100&id=p62ASPK2Kpqp&format=png&color=000000"
              alt=""
              width={24}
              height={24}
            />
          </div>
          <div className="theme-panel flex h-10 w-10 items-center justify-center rounded-full">
            <Image
              src="https://img.icons8.com/?size=100&id=h1ACssMxjHCf&format=png&color=000000"
              alt=""
              width={24}
              height={24}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
