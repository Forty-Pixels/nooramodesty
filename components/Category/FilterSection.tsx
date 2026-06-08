"use client";

import React from "react";
import { ChevronUp } from "lucide-react";

interface FilterSectionProps {
  title: string;
  isOpen: boolean;
  children: React.ReactNode;
  onToggle: () => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ title, isOpen, children, onToggle }) => {
  return (
    <section className="border-b border-black/10 py-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left text-sm font-bold uppercase tracking-[0.12em] text-[#333] outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-4"
      >
        {title}
        <ChevronUp size={14} strokeWidth={1.5} className={`transition-transform ${isOpen ? "" : "rotate-180"}`} />
      </button>
      {isOpen && <div className="mt-5">{children}</div>}
    </section>
  );
};
