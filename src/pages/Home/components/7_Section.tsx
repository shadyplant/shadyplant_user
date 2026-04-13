"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full overflow-hidden border-t border-[#2b5f1f]/20 bg-[linear-gradient(135deg,#143810_0%,#245b19_50%,#75a33b_140%)] py-12 text-white shadow-[0_-18px_60px_rgba(20,56,16,0.14)]">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <MapPin size={18} /> Address
                </h3>
                <p className="text-sm text-green-100/90">
                  T.N.D Bazar, Barpeta, Assam. <br />
                  781319 - NH 31c
                </p>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <Phone size={18} /> Contact
                </h3>
                <p className="text-sm text-green-100/90">
                  Prop. Roushan Alam <br />
                  +91 60015 18547
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2 text-sm text-green-100/90">
                <li>
                  <Link href="/" className="cursor-pointer hover:underline">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#about"
                    className="cursor-pointer hover:underline"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blogs" className="cursor-pointer hover:underline">
                    Blogs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#contact"
                    className="cursor-pointer hover:underline"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold">Subscribe us.</h3>

                <div className="flex overflow-hidden rounded-2xl border border-white/15 bg-white/90">
                  <div className="flex items-center px-3 text-green-900">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter email...."
                    className="w-full px-3 py-2 text-sm text-black outline-none"
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold">Follow Us.</h3>

                <div className="flex items-center gap-3 text-sm text-green-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 p-2 backdrop-blur-sm">
                    <Image
                      src="https://img.icons8.com/?size=100&id=Xy10Jcu1L2Su&format=png&color=000000"
                      alt=""
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 p-2 backdrop-blur-sm">
                    <Image
                      src="https://img.icons8.com/?size=100&id=p62ASPK2Kpqp&format=png&color=000000"
                      alt=""
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 p-2 backdrop-blur-sm">
                    <Image
                      src="https://img.icons8.com/?size=100&id=h1ACssMxjHCf&format=png&color=000000"
                      alt=""
                      width={24}
                      height={24}
                    />
                  </div>
                  <span>grass_green_nursery</span>
                </div>
              </div>
            </div>
          </div>

        <div className="mt-10 flex flex-col justify-between border-t border-white/15 pt-4 text-xs text-green-100/80 md:flex-row">
          <span>copyright@2026</span>
          <span>GRASS GREEN NURSERY</span>
        </div>
      </div>
    </footer>
  );
}
