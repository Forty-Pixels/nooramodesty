"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnnouncementBarProps {
  text?: string;
  href?: string;
}

function MarqueeSegment({ text, href }: { text: string; href?: string }) {
  const content = (
    <span className="px-8 text-[9px] font-bold uppercase tracking-[0.28em] text-white">
      {text}
    </span>
  );

  return href ? (
    <Link href={href} className="shrink-0 hover:opacity-80">
      {content}
    </Link>
  ) : (
    <span className="shrink-0">{content}</span>
  );
}

export function AnnouncementBar({ text, href }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!text) return null;

  const duration = Math.max(7, text.length * 0.18);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="announcement-bar"
          key="announcement-bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 24, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-[60] overflow-hidden bg-[#8B8378]"
        >
          <div className="relative flex h-6 items-center overflow-hidden">
            <div className="min-w-0 grow overflow-hidden">
              <motion.div
                className="flex w-max items-center whitespace-nowrap"
                animate={{ x: ["0%", "-33.333333%"] }}
                transition={{ duration, ease: "linear", repeat: Infinity }}
              >
                <MarqueeSegment text={text} href={href} />
                <MarqueeSegment text={text} href={href} />
                <MarqueeSegment text={text} href={href} />
              </motion.div>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="relative z-10 flex h-6 shrink-0 items-center bg-[#8B8378] pl-3 pr-3 text-white/70 transition-colors hover:text-white"
              aria-label="Close announcement"
            >
              <X size={12} strokeWidth={1.8} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
