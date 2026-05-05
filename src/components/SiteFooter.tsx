import Link from "next/link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

const shopLinks = [
  { label: "All Products", href: "/search" },
  { label: "Indoor Plants", href: "/search?category=Indoor%20Plants" },
  { label: "Outdoor Plants", href: "/search?category=Outdoor%20Plants" },
  { label: "Lawn Grass", href: "/search?category=Lawn%20Grass" },
  { label: "Ferns", href: "/search?category=Ferns" },
];

const companyLinks = [
  { label: "Home", href: "/" },
  { label: "Blogs", href: "/blogs" },
  { label: "Get a Quote", href: "/get-quote" },
  { label: "Orders", href: "/order" },
  { label: "Profile", href: "/profile" },
];

const supportLinks = [
  { label: "Cart", href: "/cart" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Checkout", href: "/checkout" },
  { label: "Payment", href: "/payment" },
  { label: "Order Summary", href: "/order-summary" },
];

const legalLinks = [
  {
    label: "Privacy Policy",
    href: "mailto:nurserygrassgreen@gmail.com?subject=Privacy%20Policy%20Request",
  },
  {
    label: "Terms & Conditions",
    href: "mailto:nurserygrassgreen@gmail.com?subject=Terms%20and%20Conditions%20Request",
  },
  {
    label: "Shipping & Returns",
    href: "mailto:nurserygrassgreen@gmail.com?subject=Shipping%20and%20Returns%20Request",
  },
  {
    label: "Cancellation Help",
    href: "mailto:nurserygrassgreen@gmail.com?subject=Cancellation%20Support",
  },
];

function FooterLinkList({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[#2e5623]">
        {title}
      </h3>
      <div className="mt-4 flex flex-col gap-3 text-sm">
        {links.map((link) => (
          <Link
            key={`${title}-${link.label}`}
            href={link.href}
            className="text-[#355f2a] transition hover:text-[#173d12]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#dde6d8] bg-[#f1f2f0] text-[#173d12]">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-3  px-4 py-3">
              <span className="rounded-xl p-2 text-[#173d12]">
                <Image
                  src="/ggn-logo2.svg"
                  alt="Grass Green Nursery"
                  width={188}
                  height={54}
                  priority
                  className="h-10 w-auto md:h-13"
                />
              </span>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#4f6847]">
              Plant-focused e-commerce storefront for indoor plants, outdoor
              plants, lawn grass, ferns, and nursery essentials with
              delivery-friendly ordering and support.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e7eee2] px-3 py-1.5 text-xs font-semibold text-[#355f2a]">
                Secure checkout
              </span>
              <span className="rounded-full bg-[#e7eee2] px-3 py-1.5 text-xs font-semibold text-[#355f2a]">
                Order tracking
              </span>
              <span className="rounded-full bg-[#e7eee2] px-3 py-1.5 text-xs font-semibold text-[#355f2a]">
                Nursery support
              </span>
            </div>
          </div>

          <FooterLinkList title="Shop" links={shopLinks} />
          <FooterLinkList title="Company" links={companyLinks} />

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-1">
            <FooterLinkList title="Support" links={supportLinks} />

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[#2e5623]">
                Legal
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                {legalLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[#355f2a] transition hover:text-[#173d12]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-[#dbe3d6] pt-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[#2e5623]">
              Contact
            </h3>
            <div className="mt-4 space-y-3 text-sm text-[#4f6847]">
              <p className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                Shariatpur, near TND Bazar, Assam-781319
              </p>
              <p className="flex items-center gap-3">
                <Phone size={16} className="shrink-0" />
                +91 60015 18547
              </p>
              <p className="flex items-center gap-3">
                <Mail size={16} className="shrink-0" />
                nurserygrassgreen@gmail.com
              </p>
            </div>
          </div>

          <div className="text-sm text-[#5f7756] md:text-right">
            <p>© 2026 Grass Green Nursery. All rights reserved.</p>
            <p className="mt-1">
              Built for plant shopping, delivery support, and nursery care.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
