import SiteShell from "@/components/SiteShell";
import {
  featuredBlogArticle,
  getArticlePreview,
  moreBlogArticles,
} from "./mockArticleData";
import FeaturedBlogCard from "./components/FeaturedBlogCard";
import BlogPreviewCard from "./components/BlogPreviewCard";
import SiteFooter from "@/components/SiteFooter";

export default function BlogsPage() {
  return (
    <SiteShell>
      <section className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-5xl px-4 md:px-2">
          <FeaturedBlogCard
            href={`/blogs/${featuredBlogArticle.slug}`}
            title={featuredBlogArticle.title}
            summary={getArticlePreview(featuredBlogArticle, 240)}
            publishedAt={featuredBlogArticle.published_date}
            author={featuredBlogArticle.author_name}
            coverImage={featuredBlogArticle.featured_image.url}
            caption={featuredBlogArticle.featured_image.caption}
          />

          <div className="mt-10">
            <h2 className="mb-6 text-[18px] font-semibold text-gray-800 md:text-xl">
              More Blogs
            </h2>

            <div className="space-y-8">
              {moreBlogArticles.map((post) => (
                <BlogPreviewCard
                  key={post.slug}
                  href={`/blogs/${post.slug}`}
                  title={post.title}
                  excerpt={getArticlePreview(post, 140)}
                  coverImage={post.featured_image.url}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter/>
    </SiteShell>
  );
}
