"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";

interface AnnouncementBarProps {
  text?: string;
  href?: string;
}

export function AnnouncementBar({ text, href }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !text) return null;

  const content = (
    <span className="block truncate px-8 text-center text-[9px] font-bold uppercase tracking-[0.28em] text-white">
      {text}
    </span>
  );

  return (
    <div className="relative z-[60] h-6 bg-black">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center px-4">
        {href ? (
          <Link href={href} className="min-w-0 flex-1 hover:opacity-80">
            {content}
          </Link>
        ) : (
          <div className="min-w-0 flex-1">{content}</div>
        )}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/70 transition-colors hover:text-white"
          aria-label="Close announcement"
        >
          <X size={12} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

