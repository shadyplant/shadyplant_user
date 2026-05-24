import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, Leaf } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { getAllBlogSlugs, getBlogBySlug } from "@/content/blogs";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <SiteShell>
      <article className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <Link
            href="/blogs"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[#214f14] shadow-[0_12px_30px_rgba(36,54,27,0.06)] backdrop-blur-[12px]"
          >
            <ArrowLeft size={16} />
            Back to blogs
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[#52724f]">
            <span className="inline-flex items-center gap-2 rounded-[999px] border border-[rgba(36,54,27,0.08)] bg-[rgba(173,204,128,0.18)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#24361b] shadow-[0_8px_18px_rgba(36,54,27,0.05)]">
              <Leaf size={14} />
              {post.category}
            </span>
            <span>{post.publishedAt}</span>
            <span className="inline-flex items-center gap-2">
              <Clock3 size={15} />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-[-0.05em] text-[#173419] md:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-[#52724f] md:text-lg">
            {post.excerpt}
          </p>

          <div className="relative mt-10 h-72 overflow-hidden rounded-[2rem] border border-[rgba(36,54,27,0.08)] bg-[var(--surface-strong)] shadow-[0_18px_44px_rgba(36,54,27,0.08)] backdrop-blur-[16px] md:h-[28rem]">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="mt-10 space-y-8">
            {post.sections.map((section) => (
              <section key={section.heading} className="rounded-[2rem] border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-[0_12px_30px_rgba(36,54,27,0.06)] backdrop-blur-[12px] md:p-8">
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#173613]">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-7 text-[#52724f]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
