"use client";

import Link from 'next/link';
import { 
  Headphones, 
  Truck, 
  ShieldCheck
} from 'lucide-react';
import { useAppEnvironment } from "@/components/app-environment/AppEnvironmentProvider";

export default function SiteFooter() {
  const { isApp } = useAppEnvironment();

  // The native WebView shell already provides its own navigation and chrome.
  if (isApp) {
    return null;
  }

  return (
    <footer className="site-footer w-full bg-[#012d1d] text-gray-200 text-sm mt-12">


      {/* Main Footer Content */}
      <div className=" max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-6 flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-0">
        
        {/* Left Column: Brand Info & Trust Badges */}
        <div className="flex flex-col justify-between space-y-6 md:w-[34%] lg:w-[32%]">
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-2 ">
              <img 
                src="/ggn-logo2.svg" // Replace with your actual logo image path
                alt="Grass Green Nursery Logo" 
                className="w-45 h-auto bg-white rounded-xs px-3 py-2"
              />
            </div>
       {/* Description Text */}
      <p className="mt-4 text-gray-200 leading-relaxed max-w-sm">
      Established in 2018 as Grass Green Nursery, we have evolved from a trusted offline horticultural supplier into ShadyPlant, your premier digital nursery for the Northeast.
      <br/>
      In 2026, we launched shadyplant.com to revolutionize how you shop for greenery. We don&apos;t just sell plants; we deliver trust, transparency, and a greener lifestyle to your doorstep.
      </p>

          
          </div>

          {/* Trust Features */}
          <div className="grid grid-cols-3 gap-2 pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-2.5 bg-gray-100 rounded text-gray-700 mb-2">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-gray-100 whitespace-nowrap md:text-base">24*7 Support</span>
            </div>
            <div className="flex flex-col items-center text-center border-x border-white/10 px-2">
              <div className="p-2.5 bg-gray-100 rounded text-gray-700 mb-2">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-gray-100 whitespace-nowrap md:text-base">Safe Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="p-2.5 bg-gray-100 rounded text-gray-700 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-gray-100 whitespace-nowrap md:text-base">Secure Payment</span>
            </div>
          </div>
        </div>

        {/* Right Sections Wrapper */}
        <div className="flex flex-col justify-between space-y-8 md:ml-auto md:w-[60%] lg:w-[58%]">
          
          {/* Sitemap Bar & Main Link Columns */}
          <div className="space-y-6">
            {/* Sitemap Header Row */}
            <div className="pb-4">
              <h3 className="mb-2 text-md font-semibold text-gray-100 md:text-lg">Sitemap</h3>

              <div className="space-y-2 text-[13px] leading-6 text-gray-200 sm:text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Latest collections
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Lawn grass
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Indoor plants
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Outdoor Plants
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Plants saplings
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Home
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Cart
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    All products
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Orders
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Wishlists
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Blog
                  </Link>
                  <span className="hidden h-3 w-px bg-gray-400 sm:block" />
                  <Link href="#" className="hover:text-emerald-600 transition">
                    Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Triple Vertical Link Lists */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[max-content_max-content_max-content] sm:justify-between">
              <div>
                <h3 className="font-semibold text-md text-gray-100 mb-3 md:text-lg">Company</h3>
                <ul className="space-y-2 text-gray-200">
                  <li><Link href="/about-us" className="hover:text-emerald-600 transition">About us</Link></li>
                  <li><Link href="/contact-us" className="hover:text-emerald-600 transition">Contact us</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-md text-gray-100 mb-3 md:text-lg">Shop</h3>
                <ul className="space-y-2 text-gray-200">
                  <li><Link href="/lawn-grass" className="hover:text-emerald-600 transition">Lawn grass</Link></li>
                  <li><Link href="#" className="hover:text-emerald-600 transition">Indoor plants</Link></li>
                  <li><Link href="#" className="hover:text-emerald-600 transition">Outdoor plants</Link></li>
                  <li><Link href="#" className="hover:text-emerald-600 transition">Plants saplings</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-md text-gray-100 mb-3 md:text-lg">Policy</h3>
                <ul className="space-y-2   text-gray-200">
                  <li><Link href="/privacy-policy" className="hover:text-emerald-600 transition">Privacy policy</Link></li>
                  <li><Link href="/terms-and-conditions" className="hover:text-emerald-600 transition">Terms & conditions</Link></li>
                  <li><Link href="/shipping-policy" className="hover:text-emerald-600 transition">Shipping & return policy</Link></li>
                  <li><Link href="/refund-policy" className="hover:text-emerald-600 transition">Refund policy</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Metas (Payment, Media, Contact) */}
          <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-[max-content_max-content_max-content] sm:justify-between">
            {/* Payments */}
            <div>
              <h3 className="font-semibold text-md text-gray-100 mb-3 md:text-lg">Payment</h3>
              <ul className="space-y-2   text-gray-200">
                <li className="flex items-center space-x-2">
                  <img
                    src="https://img.icons8.com/?size=100&id=5RcHTSNy4fbL&format=png&color=000000"
                    alt="UPI"
                    className="h-5 w-5 shrink-0 object-contain"
                  />
                  <span>UPI Payment</span>
                </li>
                <li className="flex items-center space-x-2 pl-6">
                  <span className="text-[13px] text-gray-200">Gpay/Phonepe/Paytm</span>
                </li>
                <li className="flex items-center space-x-2">
                  <img
                    src="https://cdn-icons-png.magnific.com/256/189/189392.png?semt=ais_white_label"
                    alt="Debit and credit cards"
                    className="h-5 w-5 shrink-0 object-contain"
                  />
                  <span>Debit/Credit cards</span>
                </li>
                <li className="flex items-center space-x-2">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2655/2655001.png"
                    alt="Net banking"
                    className="h-5 w-5 shrink-0 object-contain"
                  />
                  <span>Net bankings</span>
                </li>
              </ul>
            </div>

            {/* Media Links */}
            <div>
              <h3 className="font-semibold text-md text-gray-100 mb-3 md:text-lg">Media</h3>
              <ul className="space-y-2   text-gray-200">
                <li>
                  <a href="https://www.instagram.com/official_shadyplant" className="flex items-center space-x-2 hover:text-emerald-600 transition">
                    <img
                      src="https://img.icons8.com/?size=100&id=ZRiAFreol5mE&format=png&color=000000"
                      alt="Instagram"
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    <span>@official_shadyplant</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.facebook.com/officialshadyplant" className="flex items-center space-x-2 hover:text-emerald-600 transition">
                    <img
                      src="https://img.icons8.com/?size=100&id=uLWV5A9vXIPu&format=png&color=000000"
                      alt="Facebook"
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    <span>@shadyplant_northeast</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@shadyPlantNE" className="flex items-center space-x-2 hover:text-emerald-600 transition">
                    <img
                      src="https://img.icons8.com/?size=100&id=qLVB1tIe9Ts9&format=png&color=000000"
                      alt="YouTube"
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    <span>@shadyPlant NE</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="font-semibold text-md text-gray-100 mb-3 md:text-lg">Contact</h3>
              <p className="  text-gray-200 leading-relaxed">
                Barpeta, Assam - 781319<br />
                <a href="mailto:support@shadyplant.com" className="hover:underline text-gray-200">
                  support@shadyplant.com
                </a><br />
                <span className="text-gray-200 block mt-1">GST : 18BNZPA9267Q1ZP</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Sub-Footer Baseline */}
      <div className="w-full border-t-[0.5px] border-white/10 text-xs py-7">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div>
           <span className="text-gray-400">
             All rights reserved of IT Act 2000.
           </span>
          </div>
          <div className="text-gray-300 font-medium">
            shadyplant.com - <span className="text-gray-400 font-normal">A Unit Of Grass Green Nursery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
