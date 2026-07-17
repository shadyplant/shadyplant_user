import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type FeaturedBlogCardProps = {
  href: string;
  title: string;
  summary: string;
  publishedAt: string;
  author: string;
  coverImage: string;
  caption?: string;
};

export default function FeaturedBlogCard({
  href,
  title,
  summary,
  publishedAt,
  author,
  coverImage,
  caption,
}: FeaturedBlogCardProps) {
  const imageSrc = coverImage.trim();

  return (
    <Link href={href} className="group block text-left">
      <article className="space-y-4">
        <h2 className="max-w-full text-2xl font-semibold text-gray-800 md:text-2xl">
          {title}
        </h2>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#cfcfcf]" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-neutral-900">{author}</div>
            <div className="text-xs text-neutral-500">{publishedAt}</div>
          </div>
        </div>

        <div className="relative h-[235px] w-full overflow-hidden bg-[#e1e1e1] md:h-[280px]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 680px"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#e1e1e1] text-[11px] uppercase tracking-[0.18em] text-[#7a7a7a]">
              No image
            </div>
          )}
        </div>

        {caption ? (
          <p className="text-center text-[10px] italic text-[#777]">
            {caption}
          </p>
        ) : null}

        <h3 className="max-w-full text-[18px] font-semibold leading-[1.18] tracking-[-0.03em] text-[#242424] md:text-[20px]">
          Lorem ipsum dolor sit amet.
        </h3>

        <p className="max-w-full text-base leading-6 text-gray-700">
          {summary}
        </p>

        <span className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-[12px] font-medium text-gray-600 transition group-hover:bg-gray-100">
          Learn more
          <ArrowRight size={14} />
        </span>
      </article>
    </Link>
  );
}
