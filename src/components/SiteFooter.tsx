import Link from "next/link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Order Page", href: "/order" },
  { label: "Cart", href: "/cart" },
  { label: "Blogs", href: "/blogs" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[#d7dfd2] bg-[#24361b] pb-18 text-[#edf8dd] md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.2fr_0.8fr_0.9fr] md:px-6">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3">
            <span className="rounded-full bg-[#dff5b6] p-2 text-[#173d12]">
              <Leaf size={18} />
            </span>
            <span className="text-sm font-black uppercase tracking-[0.2em]">
              Grass Green Nursery
            </span>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#d4e8c6]">
            Plant-focused e-commerce storefront for indoor plants, outdoor plants,
            lawn grass, ferns, and garden essentials with delivery-friendly ordering.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[#b7d96a]">
            Quick Links
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[#b7d96a]">
            Contact
          </h3>
          <div className="mt-4 space-y-3 text-sm text-[#d4e8c6]">
            <p className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              Hajo Road nursery lane, Guwahati, Assam
            </p>
            <p className="flex items-center gap-3">
              <Phone size={16} className="shrink-0" />
              +91 98765 43210
            </p>
            <p className="flex items-center gap-3">
              <Mail size={16} className="shrink-0" />
              hello@grassgreennursery.in
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
