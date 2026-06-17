"use client";

import Image from "next/image";
import Link from "next/link";
import BlogIcon from "@/assets/home_section_icons/blog";
import { blogArticles, getArticlePreview } from "@/app/blogs/mockArticleData";

function formatPublishedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BlogsSection() {
  const featuredPosts = blogArticles.slice(0, 4);
  const shouldCenterTrack = featuredPosts.length <= 3;

  if (!featuredPosts.length) {
    return null;
  }

  return (
    <section className="px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center md:h-7 md:w-7">
              <BlogIcon
                className="h-auto max-h-full w-auto max-w-full"
                aria-hidden="true"
              />
            </div>
            <span className="text-xl text-[#163915] md:text-3xl">Blogs</span>
          </div>
        </div>

        <div
          className={`flex snap-x snap-mandatory gap-4 overflow-x-auto px-0 pb-2 scroll-smooth scrollbar-hide ${
            shouldCenterTrack ? "md:justify-center" : ""
          }`}
        >
          {featuredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="group w-[84vw] max-w-[24rem] shrink-0 snap-center overflow-hidden rounded-[0.5rem] bg-white transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,44,21,0.08)] sm:w-[20rem]"
            >
              <div className="relative aspect-[1.15/0.78] overflow-hidden rounded-[0.5rem] m-0 md:m-3">
                <Image
                  src={post.featured_image.url}
                  alt={post.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                />
              </div>

              <div className="px-4 pb-4 pt-1">
                <span className="line-clamp-1 text-[1.05rem] leading-[1.2] text-[#1b2517] md:text-[1.12rem]">
                  {post.title}
                </span>
                <p className="mt-3 line-clamp-3 text-sm leading-5 text-[#5c6757]">
                  {getArticlePreview(post, 120)}
                </p>
                <p className="mt-4 text-sm font-medium text-[#5c6757]">
                  {formatPublishedDate(post.published_date)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/blogs"
            className="inline-block border border-[#f2f2f2] hover:border-[#f2f2f2] hover:bg-[#f2f2f2]/10 text-sm text-[#214f14] transition-all px-3 py-2 rounded-[0.5rem]"
          >
            Know more
          </Link>
        </div>
      </div>
    </section>
  );
}
