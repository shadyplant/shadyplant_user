"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import RatingReviewIcon from "@/assets/home_section_icons/ratingReview";

type Review = {
  name: string;
  profileImageUrl?: string;
  location: string;
  rating: number;
  review: string;
 
};

const reviews: Review[] = [
  {
    name: "Ritika Sharma",
    profileImageUrl: "https://southindianactress.in/wp-content/uploads/2025/09/Ritika-Nayak-44.jpg",
    location: "Shillong, Meghalaya",
    rating: 4.5,
    review:
      "The lawn grass arrived fresh and healthy, and the team guided us properly on watering and first-week care. The whole process felt easy and reliable.",
  },
  {
    name: "Aman Das",
    profileImageUrl: "https://www.financialexpress.com/wp-content/uploads/2024/04/Gupta-1.jpg",
    location: "Guwahati, Assam",
    rating: 5,
    review:
      "We ordered indoor plants for our office reception and everything looked premium on arrival. Packaging was neat, delivery was on time, and the plants settled in beautifully.",
  },
  {
    name: "Mark Zuckerberg",
    profileImageUrl: "https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2014/11/8/1415445010984/Mark-Zuckerberg-012.jpg?width=700&quality=85&auto=format&fit=max&s=3341e885bb65b99b28229eaac0eff220",
    location: "Silchar, Assam",
    rating: 4.5,
    review:
      "I liked how simple the ordering flow was. The nursery team helped me choose low-maintenance plants and the quality matched what I saw on the website.",
  },
  {
    name: "Elon Musk",
    profileImageUrl: "https://fortune.com/img-assets/wp-content/uploads/2025/12/GettyImages-2184585949-e1764604910536.jpg?w=1440&q=75",
    location: "Jorhat, Assam",
    rating: 5,
    review:
      "Great experience for a bulk garden order. The plants were healthy, the support team stayed responsive, and the delivery coordination was smoother than expected.",
  },
  {
    name: "Priya Deka",
    profileImageUrl: "https://www.financialexpress.com/wp-content/uploads/2024/04/Gupta-1.jpg",
    location: "Tezpur, Assam",
    rating: 4.5,
    review:
      "The ordering process was smooth and the team was helpful with care tips after delivery. The plants looked fresh and matched the product photos closely.",
  },
  {
    name: "Sourav Joshi",
    profileImageUrl: "https://www.financialexpress.com/wp-content/uploads/2024/04/Gupta-1.jpg",
    location: "Dibrugarh, Assam",
    rating: 5,
    review:
      "Very happy with the overall experience. Delivery updates were clear, the packaging was neat, and the nursery quality felt better than many local options.",
  },
  {
    name: "Aniz Mia",
    profileImageUrl: "https://i.ibb.co/hFQYmbBX/IMG-20250329-205520-077.jpg",
    location: "TND, Assam",
    rating: 5,
    review:
      "I ordered a variety of indoor plants and they all arrived in excellent condition. The team was responsive to my questions and the delivery was punctual.",
  },
];

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const fillPercent = Math.max(0, Math.min(100, (rating - index) * 100));

    return (
      <div key={`${rating}-${index}`} className="relative h-5 w-5">
        <Star className="absolute inset-0 h-5 w-5 text-zinc-200" fill="currentColor" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
          <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
        </div>
      </div>
    );
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function ReviewsSection() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const showCarouselControls = reviews.length > 4;

  function scrollReviews(direction: "prev" | "next") {
    if (!sliderRef.current) {
      return;
    }

    const scrollAmount = sliderRef.current.clientWidth * 0.9;
    sliderRef.current.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }

  return (
    <section className=" px-4 pt-8 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between gap-4 md:mb-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              
              <h2 className="text-xl text-[#163915] sm:text-2xl">
                Verified Reviews
              </h2>
            </div>
          </div>
          {showCarouselControls ? (
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => scrollReviews("prev")}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e1d5] bg-white text-[#163915] transition hover:bg-[#edf4eb]"
                aria-label="Previous reviews"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => scrollReviews("next")}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e1d5] bg-white text-[#163915] transition hover:bg-[#edf4eb]"
                aria-label="Next reviews"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : null}
        </div>

        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
        >
          {reviews.map((item) => (
            <article
              key={`${item.name}-${item.location}`}
              className="flex w-[72vw] shrink-0 snap-start flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md sm:w-[30rem] md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
            >
              <div>
                {/* User Info Header */}
                <div className="flex items-center gap-4">
                  {item.profileImageUrl ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#163915]/10 to-[#163915]/20">
                      <Image
                        src={item.profileImageUrl}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#163915]/10 to-[#163915]/20 text-base font-semibold text-[#163915]">
                      {getInitials(item.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-base font-semibold text-zinc-800">
                        {item.name}
                      </h3>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          d="M11.5283 1.5999C11.7686 1.29437 12.2314 1.29437 12.4717 1.5999L14.2805 3.90051C14.4309 4.09173 14.6818 4.17325 14.9158 4.10693L17.7314 3.3089C18.1054 3.20292 18.4799 3.475 18.4946 3.86338L18.6057 6.78783C18.615 7.03089 18.77 7.24433 18.9984 7.32823L21.7453 8.33761C22.1101 8.47166 22.2532 8.91189 22.0368 9.23478L20.4078 11.666C20.2724 11.8681 20.2724 12.1319 20.4078 12.334L22.0368 14.7652C22.2532 15.0881 22.1101 15.5283 21.7453 15.6624L18.9984 16.6718C18.77 16.7557 18.615 16.9691 18.6057 17.2122L18.4946 20.1366C18.4799 20.525 18.1054 20.7971 17.7314 20.6911L14.9158 19.8931C14.6818 19.8267 14.4309 19.9083 14.2805 20.0995L12.4717 22.4001C12.2314 22.7056 11.7686 22.7056 11.5283 22.4001L9.71949 20.0995C9.56915 19.9083 9.31823 19.8267 9.08421 19.8931L6.26856 20.6911C5.89463 20.7971 5.52014 20.525 5.50539 20.1366L5.39427 17.2122C5.38503 16.9691 5.22996 16.7557 5.00164 16.6718L2.25467 15.6624C1.88986 15.5283 1.74682 15.0881 1.96317 14.7652L3.59221 12.334C3.72761 12.1319 3.72761 11.8681 3.59221 11.666L1.96317 9.23478C1.74682 8.91189 1.88986 8.47166 2.25467 8.33761L5.00165 7.32823C5.22996 7.24433 5.38503 7.03089 5.39427 6.78783L5.50539 3.86338C5.52014 3.475 5.89463 3.20292 6.26857 3.3089L9.08421 4.10693C9.31823 4.17325 9.56915 4.09173 9.71949 3.90051L11.5283 1.5999Z"
                          fill="#457de5"
                        />
                        <path
                          d="M9 12L11 14L15 10"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="truncate text-xs font-medium text-zinc-400">
                      {item.location}
                    </p>
                  </div>
                </div>

                {/* Quote Icon */}
                <div className="mt-6">
                  <Quote className="h-6 w-6 text-[#ece9e9] " fill="#f1eded" />
                </div>

                {/* Review Body */}
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 line-clamp-5">
                  &quot;{item.review}&quot;
                </p>
              </div>

              {/* Footer Section */}
              <div className="mt-6 border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-zinc-800">
                      {item.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-zinc-400">/5</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {renderStars(item.rating)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
