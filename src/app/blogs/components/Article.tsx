import React from "react";

export interface ImageModel {
  url: string;
  alt_text?: string;
  caption?: string;
}

export interface MiniSection {
  label: string;
  image?: ImageModel;
  content: string;
}

export interface Subsection {
  label: string;
  image?: ImageModel;
  content: string;
  mini_sections?: MiniSection[];
}

export interface MainSection {
  label: string;
  content: string;
  subsections?: Subsection[];
}

export interface ArticleDataProps {
  id: string;
  slug: string;
  title: string;
  author_profile_image: {
    url: string;
  };
  author_name: string;
  published_date: string;
  read_time: string;
  featured_image: ImageModel;
  introduction: {
    label: string;
    content: string;
  };
  main_section: MainSection[];
}

interface ArticleComponentProps {
  data: ArticleDataProps;
}

export default function Article({ data }: ArticleComponentProps) {
  if (!data) return null;

  return (
    <article className="mx-auto max-w-full bg-white px-0 py-5 md:py-5 text-neutral-800 antialiased">
      <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-neutral-900 md:text-2xl">
        {data.title}
      </h1>

      <div className="mb-8 flex items-center gap-3">
        {data.author_profile_image?.url ? (
          <img
            src={data.author_profile_image.url}
            alt={data.author_name}
            className="h-11 w-11 rounded-full bg-neutral-200 object-cover"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-neutral-200" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-neutral-900">
            {data.author_name}
          </span>
          <span className="text-xs text-neutral-500">
            {data.published_date}
            {data.read_time ? ` • ${data.read_time}` : ""}
          </span>
        </div>
      </div>

      {data.featured_image?.url ? (
        <figure className="my-8">
          <img
            src={data.featured_image.url}
            alt={data.featured_image.alt_text || "Featured image"}
            className="h-auto max-h-[350px] w-full rounded bg-neutral-100 object-cover"
          />
          {data.featured_image.caption ? (
            <figcaption className="mt-2 text-center text-xs italic text-neutral-500">
              {data.featured_image.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {data.introduction ? (
        <section className="mb-10">
          <h2 className="mb-4 mt-10 text-2xl font-bold text-neutral-900">
            {data.introduction.label}
          </h2>
          <div
            className="prose prose-neutral max-w-none space-y-4 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: data.introduction.content }}
          />
        </section>
      ) : null}

      {data.main_section?.map((mainSec, mIdx) => (
        <section key={mIdx} className="mb-10">
          <h2 className="mb-4 mt-10 text-2xl font-bold text-neutral-900">
            {mainSec.label}
          </h2>
          <div
            className="prose prose-neutral mb-6 max-w-none space-y-4 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: mainSec.content }}
          />

          {mainSec.subsections?.map((subSec, sIdx) => (
            <div key={sIdx} className="mt-8">
              <h3 className="mb-3 mt-8 text-xl font-bold text-neutral-900">
                {subSec.label}
              </h3>

              {subSec.image?.url ? (
                <figure className="my-6">
                  <img
                    src={subSec.image.url}
                    alt={subSec.image.alt_text || ""}
                    className="h-auto max-h-[300px] w-full rounded bg-neutral-100 object-cover"
                  />
                  {subSec.image.caption ? (
                    <figcaption className="mt-2 text-center text-xs italic text-neutral-500">
                      {subSec.image.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}

              <div
                className="prose prose-neutral mb-6 max-w-none space-y-4 text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: subSec.content }}
              />

              {subSec.mini_sections?.map((miniSec, pIdx) => (
                <div key={pIdx} className="mt-6 pl-1">
                  <h4 className="mb-2 mt-6 text-lg font-bold text-neutral-900">
                    {miniSec.label}
                  </h4>

                  {miniSec.image?.url ? (
                    <figure className="my-4">
                      <img
                        src={miniSec.image.url}
                        alt={miniSec.image.alt_text || ""}
                        className="h-auto max-h-[200px] w-full rounded bg-neutral-100 object-cover"
                      />
                      {miniSec.image.caption ? (
                        <figcaption className="mt-2 text-center text-xs italic text-neutral-500">
                          {miniSec.image.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ) : null}

                  <div
                    className="prose prose-neutral max-w-none space-y-4 text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: miniSec.content }}
                  />
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}
