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
            className="theme-panel mb-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#214f14]"
          >
            <ArrowLeft size={16} />
            Back to blogs
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[#52724f]">
            <span className="theme-chip px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <Leaf size={14} />
              {post.category}
            </span>
            <span>{post.publishedAt}</span>
            <span className="inline-flex items-center gap-2">
              <Clock3 size={15} />
              {post.readTime}
            </span>
          </div>

          <h1 className="theme-section-title text-4xl font-black tracking-[-0.05em] md:text-6xl">
            {post.title}
          </h1>
          <p className="theme-muted mt-5 text-base leading-7 md:text-lg">
            {post.excerpt}
          </p>

          <div className="theme-panel-strong relative mt-10 h-72 overflow-hidden rounded-[2rem] md:h-[28rem]">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="mt-10 space-y-8">
            {post.sections.map((section) => (
              <section key={section.heading} className="theme-panel rounded-[2rem] p-6 md:p-8">
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#173613]">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="theme-muted text-base leading-7"
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
