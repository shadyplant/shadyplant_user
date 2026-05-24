import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Leaf } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { blogPosts } from "@/content/blogs";

export default function BlogsPage() {
  const [featuredPost, ...otherPosts] = blogPosts;

  return (
    <SiteShell>
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-[999px] border border-[rgba(36,54,27,0.08)] bg-[rgba(173,204,128,0.18)] px-6 py-2 text-sm font-medium text-[#24361b] shadow-[0_8px_18px_rgba(36,54,27,0.05)]">
              <Leaf size={16} />
              Blog Library
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-[#173419] md:text-6xl">
              Practical Lawn Grass Guides
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#52724f] md:text-lg">
              Simple articles for homeowners, builders, and project teams who
              want better planning, cleaner installation, and more reliable
              carpet grass supply decisions.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <article className="overflow-hidden rounded-[2rem] border border-[rgba(36,54,27,0.08)] bg-[var(--surface-strong)] shadow-[0_18px_44px_rgba(36,54,27,0.08)] backdrop-blur-[16px]">
              <div className="relative h-72 w-full md:h-96">
                <Image
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#143810]/80 via-[#143810]/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="mb-3 inline-flex rounded-full bg-[#efffd8]/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#214f14]">
                    Featured
                  </div>
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
                    {featuredPost.title}
                  </h2>
                </div>
              </div>

              <div className="space-y-5 p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#52724f]">
                  <span className="inline-flex items-center gap-2 rounded-[999px] border border-[rgba(36,54,27,0.08)] bg-[rgba(173,204,128,0.18)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#24361b] shadow-[0_8px_18px_rgba(36,54,27,0.05)]">
                    {featuredPost.category}
                  </span>
                  <span>{featuredPost.publishedAt}</span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={15} />
                    {featuredPost.readTime}
                  </span>
                </div>
                <p className="text-base leading-7 text-[#52724f]">
                  {featuredPost.excerpt}
                </p>
                <Link
                  href={`/blogs/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#24361b_0%,#365127_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(36,54,27,0.18)] transition hover:bg-[linear-gradient(135deg,#1d2e16_0%,#2f4721_100%)]"
                >
                  Read article
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>

            <div className="space-y-6">
              {otherPosts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(36,54,27,0.06)] backdrop-blur-[12px]"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-[999px] border border-[rgba(36,54,27,0.08)] bg-[rgba(173,204,128,0.18)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#24361b] shadow-[0_8px_18px_rgba(36,54,27,0.05)]">
                      {post.category}
                    </span>
                    <span className="text-xs text-[#6c8a63]">{post.readTime}</span>
                  </div>
                  <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#173613]">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#52724f]">
                    {post.excerpt}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.18em] text-[#6c8a63]">
                      {post.publishedAt}
                    </span>
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#214f14] hover:text-[#163812]"
                    >
                      Open
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
