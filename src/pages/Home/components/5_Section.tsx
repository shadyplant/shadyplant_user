"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import Image from "next/image";

export default function EstimateSection() {
  return (
    <section id="contact" className="w-full px-4 py-16 md:px-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <div className="theme-chip mb-4 inline-flex px-6 py-2 text-sm font-medium">
            Get Free Estimate
          </div>
          <p className="theme-muted mx-auto max-w-2xl text-sm">
            Share your booking details, delivery location, and quantity so we
            can prepare a cleaner estimate for your project.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="theme-panel rounded-[2rem] p-6 md:p-8"
          >
            <div className="space-y-6">
              <div>
                <label className="text-sm text-[#31542a]">
                  Select state (we deal in Northeast India)
                </label>
                <select className="theme-input mt-2 w-full rounded-2xl px-4 py-3">
                  <option>Assam</option>
                  <option>Meghalaya</option>
                  <option>Manipur</option>
                  <option>Mizoram</option>
                  <option>Nagaland</option>
                  <option>Tripura</option>
                  <option>Arunachal Pradesh</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-[#31542a]">
                  Delivery address with pin code
                </label>
                <input
                  type="text"
                  className="theme-input mt-2 w-full rounded-2xl px-4 py-3"
                />
              </div>

              <div>
                <label className="text-sm text-[#31542a]">
                  Order quantity in square feet
                </label>
                <input
                  type="number"
                  className="theme-input mt-2 w-full rounded-2xl px-4 py-3"
                />
              </div>

              <div>
                <label className="text-sm text-[#31542a]">
                  Select booking order date
                </label>
                <div className="theme-input mt-2 flex items-center rounded-2xl px-4">
                  <input
                    type="date"
                    className="w-full bg-transparent py-3 focus:outline-none"
                  />
                  <Calendar size={18} className="text-gray-500" />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#31542a]">
                  Estimate details with WhatsApp number
                </label>
                <input
                  type="text"
                  className="theme-input mt-2 w-full rounded-2xl px-4 py-3"
                />
              </div>

              <button className="theme-button w-full rounded-2xl py-3 font-semibold transition">
                Submit
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="theme-panel overflow-hidden rounded-[2rem] p-2">
              <div className="h-[200px] overflow-hidden rounded-[1.5rem]">
                <iframe
                  src="https://www.google.com/maps?q=T.N.D+Bazar+Barpeta+Assam+781319&output=embed"
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="theme-panel rounded-[2rem] p-6 text-center">
              <h3 className="mb-4 text-lg font-medium text-gray-800">
                Reach Our Team
              </h3>

              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <div className="relative mx-auto mb-2 h-20 w-20 overflow-hidden rounded-xl">
                    <Image
                      src="https://thumbs.dreamstime.com/b/passport-photo-laughing-caucasian-man-isolated-white-background-cut-out-passport-photo-laughing-caucasian-man-275801697.jpg"
                      alt="person"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium">Mr. Roushan Alam</p>
                  <p className="theme-muted text-xs">Founder & CEO.</p>
                </div>

                <div className="text-center">
                  <div className="relative mx-auto mb-2 h-20 w-20 overflow-hidden rounded-xl">
                    <Image
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReCUJAyPzZCMQJKtKEnZX1J3gIWVBot6FUeg&s"
                      alt="person"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium">Mr. Anees Hassan</p>
                  <p className="theme-muted text-xs">
                    Brand Director & Marketer.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
