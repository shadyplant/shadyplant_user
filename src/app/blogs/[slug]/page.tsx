import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import Article from "../components/Article";
import { blogArticles, getBlogArticleBySlug } from "../mockArticleData";

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getBlogArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <SiteShell>
      <main className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <Link
            href="/blogs"
            className=" flex items-center gap-2 text-sm font-medium text-[#555] transition hover:text-[#222]"
          >
            <ArrowLeft size={16} />
            Back to blogs
          </Link>

          <Article data={article} />
        </div>
      </main>
    </SiteShell>
  );
}
