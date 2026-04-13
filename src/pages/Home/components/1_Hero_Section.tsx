"use client";

import Image from "next/image";

export default function Hero() {
  const galleryImages = [
    {
      src: "https://static.vecteezy.com/system/resources/previews/024/521/001/non_2x/natural-grass-turfs-installation-by-garden-worker-photo.jpeg",
      alt: "Grass installation worker",
    },
    {
      src: "https://static.vecteezy.com/system/resources/thumbnails/070/255/453/small/workers-installing-rolled-sod-on-sunny-day-in-residential-garden-wearing-protective-gloves-and-helmets-creating-fresh-green-lawn-with-teamwork-and-care-free-photo.jpeg",
      alt: "Workers installing fresh lawn",
    },
    {
      src: "https://balajinursery.org/wp-content/uploads/2024/09/natural-grass-turf-installer-scaled.jpg",
      alt: "Finished lawn landscape",
    },
  ];
  const trustPoints = [
    "Fresh-cut carpet grass",
    "Fast Northeast delivery",
    "Residential to bulk supply",
  ];

  return (
    <div id="home" className="relative flex min-h-screen flex-col overflow-hidden font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(221,245,124,0.6),transparent_22%),radial-gradient(circle_at_18%_36%,rgba(228,247,160,0.42),transparent_26%),radial-gradient(circle_at_82%_34%,rgba(228,247,160,0.4),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,252,235,0.96)_68%,rgba(245,251,236,0.98)_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-28 h-64 w-64 -translate-x-1/2 rounded-full bg-[#e8f98b]/35 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 top-24 h-40 w-40 rounded-full bg-white/65 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-24 h-40 w-40 rounded-full bg-white/65 blur-3xl" />

      <main className="relative z-10 flex flex-grow flex-col items-center px-6 pb-12 pt-20 md:pt-24">
        <div className="max-w-6xl text-center">
          <div className="theme-chip px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em]">
            Lawn Grass Supply Partner
          </div>

          <h1 className="mt-10 text-5xl font-black leading-[0.92] tracking-[-0.06em] text-[#173613] md:text-7xl lg:text-[6.5rem]">
            Get Carpet
            <span className="relative mx-2 inline-block align-baseline text-[#8fb63c] md:mx-3">
              <span className="relative z-10 italic">Lawn Grass</span>
              <span className="absolute bottom-2 left-0 z-0 h-3 w-full rounded-full bg-[#dff27b]/85 md:bottom-3 md:h-4" />
            </span>
            Supply
            <span className="block text-[#214f14]">At Your Doorstep</span>
          </h1>

          <p className="mx-auto mt-8 max-w-4xl text-base font-medium leading-8 text-[#4e6848] md:text-xl md:leading-9 lg:text-[1.2rem]">
            We supply high-quality carpet grass for residential, commercial,
            and large-scale projects with fast delivery and reliable service.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {trustPoints.map((point) => (
              <span
                key={point}
                className="theme-panel rounded-full px-5 py-3 text-sm font-medium text-[#486342]"
              >
                {point}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-20 mt-20 w-full max-w-6xl overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#f5fbec] via-[#f5fbec]/85 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#f5fbec] via-[#f5fbec]/85 to-transparent" />

          <div className="flex marquee-track w-max">
            {[0, 1].map((setIndex) => (
              <div
                key={setIndex}
                className="flex shrink-0 items-center gap-6 pr-6"
                aria-hidden={setIndex === 1}
              >
                {galleryImages.map((image) => (
                  <div
                    key={`${setIndex}-${image.src}`}
                    className="theme-panel-strong relative h-52 w-[300px] shrink-0 overflow-hidden rounded-[2rem] border border-white/40 p-2 shadow-[0_24px_60px_rgba(33,79,20,0.1)] md:h-72 md:w-[380px]"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="rounded-[1.5rem] object-cover"
                    />
                    <div className="absolute inset-x-5 bottom-5 rounded-full bg-[#153410]/75 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                      {image.alt}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      <style jsx>{`
        .marquee-track {
          animation: hero-marquee 28s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes hero-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
