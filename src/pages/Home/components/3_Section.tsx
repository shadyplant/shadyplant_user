"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export default function NurseryFeatures() {
  return (
    <section className="w-full px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 flex justify-center">
          <div className="theme-chip px-6 py-2 text-sm font-medium">
            <Leaf size={16} />
            Features
          </div>
        </div>

        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative h-32 w-full overflow-hidden rounded-[1.5rem] border border-white/40 shadow-[0_18px_40px_rgba(33,79,20,0.1)]"
            >
              <Image
                src="https://s.alicdn.com/@sc04/kf/H409f5caec30349258d05c1c91656dba3b/Turflory-Artificial-Grass-Price-Per-square-Foot-Customized-Sled-Gym-Grass-Baseball-Synthetic-Turf-Carpet-Roll-Price.png_300x300.jpg"
                alt="grass"
                fill
                className="object-cover"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative h-32 w-full overflow-hidden rounded-[1.5rem] border border-white/40 shadow-[0_18px_40px_rgba(33,79,20,0.1)]"
            >
              <Image
                src="https://png.pngtree.com/png-vector/20250921/ourlarge/pngtree-square-patch-of-artificial-grass-with-dense-green-texture-and-clean-png-image_17352889.webp"
                alt="grass"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative h-[260px] w-full overflow-hidden rounded-[2rem] border border-white/40 shadow-[0_24px_60px_rgba(33,79,20,0.12)] md:col-span-2"
          >
            <Image
              src="https://static-01.daraz.pk/p/090b7487e249cbaeabe12ff38cf4e6a9.jpg"
              alt="main grass"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-2">
          <motion.div
            whileHover={{ y: -5 }}
            className="theme-panel flex flex-col items-center rounded-[2rem] px-6 py-8"
          >
            <h3 className="text-lg font-semibold text-green-700">
              Mexican and Bermuda
            </h3>
            <p className="theme-muted mb-4 text-sm">Cutting Size</p>

            <div className="relative h-[120px] w-[240px] overflow-hidden rounded-[1.25rem] shadow-md">
              <Image
                src="https://png.pngtree.com/png-vector/20250826/ourmid/pngtree-close-up-textured-view-of-vibrant-green-grass-blades-forming-a-png-image_17214326.webp"
                alt="grass type"
                fill
                className="object-cover"
              />
            </div>

            <p className="theme-muted mt-3 text-xs">1 x 2 sqft (Per Piece)</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="theme-panel flex flex-col items-center rounded-[2rem] px-6 py-8"
          >
            <h3 className="text-lg font-semibold text-green-700">Broadleaf</h3>
            <p className="theme-muted mb-4 text-sm">Cutting Size</p>

            <div className="relative h-[120px] w-[120px] overflow-hidden rounded-[1.25rem] shadow-md">
              <Image
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8eeWXBXHrsR5Lx9NljL3fgkVcSHkFWWm56Q&s"
                alt="grass type"
                fill
                className="object-cover"
              />
            </div>

            <p className="theme-muted mt-3 text-xs">1 x 1 sqft (Per Piece)</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
