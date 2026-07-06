import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ eyebrow, title, message, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex min-h-[44vh] flex-col items-center justify-center px-6 py-20 text-center">
      {eyebrow && (
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8B8378]">
          {eyebrow}
        </p>
      )}
      <h2 className="max-w-xl text-2xl font-bold uppercase tracking-[0.18em] text-black md:text-4xl">
        {title}
      </h2>
      <p className="mt-5 max-w-md text-[11px] font-bold uppercase leading-6 tracking-[0.2em] text-gray-400">
        {message}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group mt-10 inline-flex items-center gap-3 bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-colors hover:bg-zinc-800"
        >
          {actionLabel}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
