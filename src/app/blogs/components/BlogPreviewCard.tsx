import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type BlogPreviewCardProps = {
  href: string;
  title: string;
  excerpt: string;
  coverImage: string;
};

export default function BlogPreviewCard({
  href,
  title,
  excerpt,
  coverImage,
}: BlogPreviewCardProps) {
  const imageSrc = String(coverImage || "").trim();

  return (
    <Link href={href} className="group block text-left">
      <article className="grid gap-3 sm:grid-cols-[108px_minmax(0,1fr)] sm:items-start">
        <div className="relative h-[108px] overflow-hidden bg-[#2d2d2d]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover opacity-25"
              sizes="(max-width: 640px) 100vw, 140px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#343434] text-[10px] uppercase tracking-[0.18em] text-white/55">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-[17px] font-bold leading-[1.12] tracking-[-0.04em] text-[#242424] md:text-[19px]">
            {title}
          </h3>
          <p className="mt-2 max-w-[300px] text-[13px] leading-5 text-[#7a7a7a]">
            {excerpt}
          </p>
          <div className="mt-3 flex justify-end">
            <span className="inline-flex items-center gap-2 rounded-none bg-[#a3a3a3] px-3 py-1.5 text-[12px] font-medium text-white transition group-hover:bg-[#8f8f8f]">
              Learn more
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
