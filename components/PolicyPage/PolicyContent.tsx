import type { PolicyPageContent } from "@/types/policy";

export interface PolicyContentProps {
  content: PolicyPageContent;
}

export const PolicyContent = ({ content }: PolicyContentProps) => {
  return (
    <section className="bg-[#f6f5f3] text-[#141414]">
      <div className="mx-auto flex min-h-[72vh] w-full max-w-[1180px] flex-col px-6 py-20 md:px-10 md:py-28 lg:px-12">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.35fr] lg:gap-20">
          <div className="space-y-8 lg:sticky lg:top-28">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8B8378]">
                {content.eyebrow}
              </p>
              <h1 className="max-w-xl text-4xl font-bold uppercase tracking-[0.16em] md:text-5xl">
                {content.title}
              </h1>
            </div>

            <div className="h-px w-20 bg-black/20" />

            <p className="max-w-md text-sm font-medium leading-7 text-black/60">
              {content.intro}
            </p>

            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40">
              Updated {content.updatedAt}
            </p>
          </div>

          <div className="border-t border-black/10">
            {content.sections.map((section) => (
              <article key={section._id} className="grid gap-4 border-b border-black/10 py-8 md:grid-cols-[180px_1fr] md:gap-10">
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#141414]">
                  {section.title}
                </h2>
                <p className="text-sm leading-7 text-black/62">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
