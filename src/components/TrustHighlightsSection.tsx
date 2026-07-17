import { Headset, ShieldCheck, Sprout, Truck } from "lucide-react";

const trustHighlights = [
  {
    title: "24x7 Customer Support",
    icon: Headset,
  },
  {
    title: "Care & planting guidance included",
    icon: Sprout,
  },
  {
    title: "Secure payments",
    icon: ShieldCheck,
  },
  {
    title: "Order tracking available",
    icon: Truck,
  },
];

export default function TrustHighlightsSection() {
  return (
    <section className="bg-[#4c8b5d] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="hidden gap-6 md:grid sm:grid-cols-2 xl:grid-cols-4">
          {trustHighlights.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex min-h-[150px] flex-col items-center justify-start gap-4 pt-2 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/12 text-white">
                <Icon className="h-7 w-7" strokeWidth={2.1} />
              </div>
              <p className="max-w-[220px] text-base font-medium leading-8 text-white/96">
                {title}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:hidden">
          {trustHighlights.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-2xl px-4 py-2"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 text-white">
                <Icon className="h-6 w-6" strokeWidth={2.1} />
              </div>
              <p className="text-left text-sm font-medium leading-6 text-white/96">
                {title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
